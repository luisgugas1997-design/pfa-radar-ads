import os
from pathlib import Path

from backend.services.client_portal_service import (
    create_portal_token,
    verify_portal_token,
)


ROOT = Path(__file__).resolve().parents[1]


def test_signed_token_rejects_tampering(monkeypatch):
    monkeypatch.setenv("PFA_PORTAL_SECRET", "teste-seguro-portal-pfa-1234567890")
    token = create_portal_token("portal-test-id", 3)
    assert verify_portal_token(token) == ("portal-test-id", 3)
    assert verify_portal_token(token[:-1] + ("0" if token[-1] != "0" else "1")) is None


def test_public_page_does_not_render_payload_with_inner_html():
    html = (ROOT / "frontend" / "client_portal.html").read_text(encoding="utf-8")
    assert "/api/public/portal/" in html
    assert "textContent = item.title" in html
    assert "noindex,nofollow,noarchive" in html


def test_admin_routes_are_protected_and_public_route_is_separate():
    main = (ROOT / "backend" / "main.py").read_text(encoding="utf-8")
    assert "app.include_router(admin_router, dependencies=RADAR_PROTEGIDO)" in main
    assert "app.include_router(public_router)" in main
    assert '"/acompanhamento/{token}"' in main


def test_portal_tables_preserve_audit_and_access_history():
    migration = (
        ROOT / "backend" / "migrations" / "004_create_client_portal.sql"
    ).read_text(encoding="utf-8")
    assert "portal_audit_events" in migration
    assert "portal_access_events" in migration
    assert "ON DELETE CASCADE" in migration
    assert "DROP TABLE" not in migration.upper()
