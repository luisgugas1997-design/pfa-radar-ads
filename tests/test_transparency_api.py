import asyncio
import os
from types import SimpleNamespace

import httpx


os.environ.setdefault(
    "DATABASE_URL",
    "postgresql+asyncpg://radar:radar@127.0.0.1:5432/radar_test",
)
os.environ.setdefault("RADAR_ACCESS_USER", "radar-test")
os.environ.setdefault("RADAR_ACCESS_PASSWORD", "senha-test")

import backend.main as main_module
from backend.database import get_db
from backend.main import app
from backend.models import Advertiser


class FakeSession:
    async def get(self, model, identifier):
        assert model is Advertiser
        if identifier != 7:
            return None
        return Advertiser(
            id=7,
            display_name="Concorrente",
            domain="concorrente.example",
        )


async def _request(
    method: str,
    path: str,
    *,
    json: dict | None = None,
    auth: bool = True,
):
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(
        transport=transport,
        base_url="http://testserver",
        auth=("radar-test", "senha-test") if auth else None,
    ) as client:
        return await client.request(method, path, json=json)


def test_transparency_exige_autenticacao() -> None:
    response = asyncio.run(
        _request(
            "GET",
            "/api/radar/advertisers/7/transparency",
            auth=False,
        )
    )

    assert response.status_code == 401


def test_scan_transparency_exige_confirmacao_literal() -> None:
    response = asyncio.run(
        _request(
            "POST",
            "/api/radar/advertisers/7/transparency/scan",
            json={"confirm_cost": False, "num": 100},
        )
    )

    assert response.status_code == 422


def test_scan_transparency_executa_uma_pagina_confirmada(monkeypatch) -> None:
    captured = {}

    async def fake_db():
        yield FakeSession()

    async def fake_quota():
        return {"remaining": 12}

    async def fake_scan(_session, advertiser, num, advertiser_query=None):
        captured.update(
            advertiser_id=advertiser.id,
            num=num,
            advertiser_query=advertiser_query,
        )
        return SimpleNamespace(id=91)

    monkeypatch.setattr(main_module, "obter_cota_serpapi", fake_quota)
    monkeypatch.setattr(main_module, "executar_transparency_scan", fake_scan)
    monkeypatch.setattr(
        main_module,
        "resumir_transparency_scan",
        lambda scan: {"id": scan.id, "status": "completed", "creatives_found": 4},
    )
    app.dependency_overrides[get_db] = fake_db
    try:
        response = asyncio.run(
            _request(
                "POST",
                "/api/radar/advertisers/7/transparency/scan",
                json={"confirm_cost": True, "num": 100},
            )
        )
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 200
    assert captured == {
        "advertiser_id": 7,
        "num": 100,
        "advertiser_query": "concorrente.example",
    }
    assert response.json()["estimated_credits"] == 1
    assert "nenhuma paginação" in response.json()["notice"].lower()


def test_scan_transparency_pode_consultar_nome_observado(monkeypatch) -> None:
    captured = {}

    async def fake_db():
        yield FakeSession()

    async def fake_quota():
        return {"remaining": 12}

    async def fake_scan(_session, advertiser, num, advertiser_query=None):
        captured.update(query=advertiser_query, num=num)
        return SimpleNamespace(id=92)

    monkeypatch.setattr(main_module, "obter_cota_serpapi", fake_quota)
    monkeypatch.setattr(main_module, "executar_transparency_scan", fake_scan)
    monkeypatch.setattr(
        main_module,
        "resumir_transparency_scan",
        lambda scan: {"id": scan.id, "status": "completed"},
    )
    app.dependency_overrides[get_db] = fake_db
    try:
        response = asyncio.run(
            _request(
                "POST",
                "/api/radar/advertisers/7/transparency/scan",
                json={
                    "confirm_cost": True,
                    "num": 100,
                    "query_mode": "advertiser_name",
                },
            )
        )
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 200
    assert captured == {"query": "Concorrente", "num": 100}


def test_get_transparency_nao_consome_credito(monkeypatch) -> None:
    async def fake_db():
        yield FakeSession()

    async def fake_get(_session, advertiser_id, limit):
        return {
            "advertiser_id": advertiser_id,
            "creatives": [],
            "measurement": {"limit": limit},
        }

    monkeypatch.setattr(
        main_module,
        "obter_transparency_do_anunciante",
        fake_get,
    )
    app.dependency_overrides[get_db] = fake_db
    try:
        response = asyncio.run(
            _request("GET", "/api/radar/advertisers/7/transparency?limit=25")
        )
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 200
    assert response.json()["measurement"]["limit"] == 25
