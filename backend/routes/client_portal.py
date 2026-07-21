import os
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_db
from backend.models import (
    ClientPortal,
    ClientPortalAccess,
    ClientPortalAudit,
    ClientPortalUpdate,
)
from backend.services.client_portal_service import (
    create_portal_token,
    fingerprint_visitor,
    verify_portal_token,
)


admin_router = APIRouter(prefix="/api/portal", tags=["Portal do cliente"])
public_router = APIRouter(prefix="/api/public/portal", tags=["Portal público"])


class PortalUpdateInput(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    source_ref: str = Field(min_length=1, max_length=160)
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=4000)
    occurred_label: str | None = Field(default=None, max_length=80)
    visible_to_client: bool = False


class PortalSyncRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    client_name: str = Field(min_length=2, max_length=255)
    case_number: str | None = Field(default=None, max_length=120)
    case_type: str | None = Field(default=None, max_length=160)
    stage: str | None = Field(default=None, max_length=120)
    responsible_name: str | None = Field(default=None, max_length=160)
    visible_sections: dict[str, bool] = Field(default_factory=dict)
    updates: list[PortalUpdateInput] = Field(default_factory=list, max_length=500)
    expires_at: datetime | None = None
    actor: str = Field(min_length=2, max_length=160)


class PortalActionRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    actor: str = Field(min_length=2, max_length=160)


async def _portal_by_external_id(
    db: AsyncSession, external_client_id: str
) -> ClientPortal | None:
    return await db.scalar(
        select(ClientPortal).where(
            ClientPortal.external_client_id == external_client_id
        )
    )


def _portal_url(request: Request, portal: ClientPortal) -> str:
    base_url = os.getenv("PFA_PORTAL_PUBLIC_URL", "").strip().rstrip("/")
    if not base_url:
        base_url = str(request.base_url).rstrip("/")
    token = create_portal_token(portal.id, portal.token_version)
    return f"{base_url}/acompanhamento/{token}"


async def _admin_payload(
    request: Request, db: AsyncSession, portal: ClientPortal
) -> dict[str, Any]:
    expired = (
        portal.expires_at is not None
        and portal.expires_at <= datetime.now(timezone.utc)
    )
    updates = (
        await db.scalars(
            select(ClientPortalUpdate)
            .where(ClientPortalUpdate.portal_id == portal.id)
            .order_by(ClientPortalUpdate.created_at.desc())
        )
    ).all()
    audits = (
        await db.scalars(
            select(ClientPortalAudit)
            .where(ClientPortalAudit.portal_id == portal.id)
            .order_by(ClientPortalAudit.created_at.desc())
            .limit(30)
        )
    ).all()
    access_count, last_access = (
        await db.execute(
            select(
                func.count(ClientPortalAccess.id),
                func.max(ClientPortalAccess.accessed_at),
            ).where(ClientPortalAccess.portal_id == portal.id)
        )
    ).one()
    return {
        "external_client_id": portal.external_client_id,
        "client_name": portal.client_name,
        "active": portal.revoked_at is None and not expired,
        "expired": expired,
        "revoked_at": portal.revoked_at,
        "expires_at": portal.expires_at,
        "url": _portal_url(request, portal),
        "visible_sections": portal.visible_sections,
        "access_count": access_count,
        "last_access_at": last_access,
        "updates": [
            {
                "source_ref": item.source_ref,
                "title": item.title,
                "description": item.description,
                "occurred_label": item.occurred_label,
                "visible_to_client": item.visible_to_client,
                "published_by": item.published_by,
                "published_at": item.published_at,
            }
            for item in updates
        ],
        "audit": [
            {
                "action": item.action,
                "actor": item.actor,
                "details": item.details,
                "created_at": item.created_at,
            }
            for item in audits
        ],
    }


@admin_router.get("/clients/{external_client_id}")
async def get_client_portal(
    external_client_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> dict:
    portal = await _portal_by_external_id(db, external_client_id)
    if portal is None:
        raise HTTPException(status_code=404, detail="Portal ainda não publicado.")
    return await _admin_payload(request, db, portal)


@admin_router.put("/clients/{external_client_id}")
async def sync_client_portal(
    external_client_id: str,
    payload: PortalSyncRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> dict:
    portal = await _portal_by_external_id(db, external_client_id)
    action = "portal_updated"
    if portal is None:
        portal = ClientPortal(
            id=str(uuid4()),
            external_client_id=external_client_id,
            client_name=payload.client_name,
            created_by=payload.actor,
        )
        db.add(portal)
        action = "portal_created"

    portal.client_name = payload.client_name
    portal.case_number = payload.case_number
    portal.case_type = payload.case_type
    portal.stage = payload.stage
    portal.responsible_name = payload.responsible_name
    portal.visible_sections = payload.visible_sections
    portal.expires_at = payload.expires_at

    existing_items = {
        item.source_ref: item
        for item in (
            await db.scalars(
                select(ClientPortalUpdate).where(
                    ClientPortalUpdate.portal_id == portal.id
                )
            )
        ).all()
    }
    incoming_refs: set[str] = set()
    now = datetime.now(timezone.utc)
    for incoming in payload.updates:
        incoming_refs.add(incoming.source_ref)
        item = existing_items.get(incoming.source_ref)
        if item is None:
            item = ClientPortalUpdate(
                portal_id=portal.id,
                source_ref=incoming.source_ref,
                title=incoming.title,
            )
            db.add(item)
        was_visible = bool(item.visible_to_client)
        item.title = incoming.title
        item.description = incoming.description
        item.occurred_label = incoming.occurred_label
        item.visible_to_client = incoming.visible_to_client
        if incoming.visible_to_client and not was_visible:
            item.published_at = now
            item.published_by = payload.actor

    for source_ref, item in existing_items.items():
        if source_ref not in incoming_refs:
            item.visible_to_client = False

    db.add(
        ClientPortalAudit(
            portal_id=portal.id,
            action=action,
            actor=payload.actor,
            details={
                "updates_received": len(payload.updates),
                "updates_visible": sum(
                    1 for item in payload.updates if item.visible_to_client
                ),
                "visible_sections": payload.visible_sections,
            },
        )
    )
    await db.commit()
    await db.refresh(portal)
    return await _admin_payload(request, db, portal)


async def _portal_action(
    external_client_id: str,
    payload: PortalActionRequest,
    request: Request,
    db: AsyncSession,
    action: str,
) -> dict:
    portal = await _portal_by_external_id(db, external_client_id)
    if portal is None:
        raise HTTPException(status_code=404, detail="Portal ainda não publicado.")
    now = datetime.now(timezone.utc)
    if action == "portal_revoked":
        portal.revoked_at = now
    elif action == "portal_reactivated":
        portal.revoked_at = None
    elif action == "link_regenerated":
        portal.token_version += 1
        portal.revoked_at = None
    db.add(
        ClientPortalAudit(
            portal_id=portal.id,
            action=action,
            actor=payload.actor,
            details={"token_version": portal.token_version},
        )
    )
    await db.commit()
    await db.refresh(portal)
    return await _admin_payload(request, db, portal)


@admin_router.post("/clients/{external_client_id}/revoke")
async def revoke_client_portal(
    external_client_id: str,
    payload: PortalActionRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> dict:
    return await _portal_action(
        external_client_id, payload, request, db, "portal_revoked"
    )


@admin_router.post("/clients/{external_client_id}/reactivate")
async def reactivate_client_portal(
    external_client_id: str,
    payload: PortalActionRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> dict:
    return await _portal_action(
        external_client_id, payload, request, db, "portal_reactivated"
    )


@admin_router.post("/clients/{external_client_id}/regenerate")
async def regenerate_client_portal_link(
    external_client_id: str,
    payload: PortalActionRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> dict:
    return await _portal_action(
        external_client_id, payload, request, db, "link_regenerated"
    )


@public_router.get("/{token}")
async def view_public_portal(
    token: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    verified = verify_portal_token(token)
    if verified is None:
        raise HTTPException(status_code=404, detail="Acompanhamento não encontrado.")
    portal_id, token_version = verified
    portal = await db.get(ClientPortal, portal_id)
    now = datetime.now(timezone.utc)
    if portal is None or token_version != portal.token_version:
        raise HTTPException(status_code=404, detail="Acompanhamento não encontrado.")
    if portal.revoked_at is not None:
        raise HTTPException(status_code=410, detail="Este acesso foi revogado.")
    if portal.expires_at is not None and portal.expires_at <= now:
        raise HTTPException(status_code=410, detail="Este acesso expirou.")

    visible_updates = (
        await db.scalars(
            select(ClientPortalUpdate)
            .where(
                ClientPortalUpdate.portal_id == portal.id,
                ClientPortalUpdate.visible_to_client.is_(True),
            )
            .order_by(ClientPortalUpdate.created_at.desc())
        )
    ).all()
    client_host = request.client.host if request.client else "unknown"
    db.add(
        ClientPortalAccess(
            portal_id=portal.id,
            visitor_fingerprint=fingerprint_visitor(
                client_host, request.headers.get("user-agent", "")
            ),
        )
    )
    await db.commit()
    body = {
        "client_name": portal.client_name,
        "case_number": portal.case_number,
        "case_type": portal.case_type,
        "stage": portal.stage,
        "responsible_name": portal.responsible_name,
        "visible_sections": portal.visible_sections,
        "expires_at": portal.expires_at,
        "updates": [
            {
                "title": item.title,
                "description": item.description,
                "occurred_label": item.occurred_label,
                "published_at": item.published_at,
            }
            for item in visible_updates
        ],
    }
    return JSONResponse(
        jsonable_encoder(body), headers={"Cache-Control": "no-store"}
    )
