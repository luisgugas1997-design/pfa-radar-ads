import asyncio
import os

import httpx
import pytest


os.environ.setdefault(
    "DATABASE_URL",
    "postgresql+asyncpg://radar:radar@127.0.0.1:5432/radar_test",
)
os.environ.setdefault("RADAR_ACCESS_USER", "radar-test")
os.environ.setdefault("RADAR_ACCESS_PASSWORD", "senha-test")

import backend.main as main_module
from backend.main import app


async def _get(path: str, *, params: dict | None = None, auth: bool = True):
    transport = httpx.ASGITransport(app=app)
    credentials = ("radar-test", "senha-test") if auth else None
    async with httpx.AsyncClient(
        transport=transport,
        base_url="http://testserver",
        auth=credentials,
    ) as client:
        return await client.get(path, params=params)


@pytest.mark.parametrize(
    "path",
    [
        "/api/radar/advertisers",
        "/api/radar/advertisers/1",
        "/api/radar/term-map",
        "/api/radar/creatives",
        "/api/radar/landing-pages/1/snapshots",
    ],
)
def test_endpoints_competitivo_exigem_autenticacao(path: str) -> None:
    response = asyncio.run(_get(path, auth=False))

    assert response.status_code == 401


def test_endpoint_anunciantes_encaminha_filtros_e_paginacao(monkeypatch) -> None:
    captured = {}

    async def listar_falso(_db, **kwargs) -> dict:
        captured.update(kwargs)
        return {
            "advertisers": [],
            "advertisers_observed": [],
            "metadata": {"scope": "observado"},
        }

    monkeypatch.setattr(main_module, "listar_anunciantes_observados", listar_falso)

    response = asyncio.run(
        _get(
            "/api/radar/advertisers",
            params={
                "days": 90,
                "page": 2,
                "page_size": 50,
                "service": "Lei Seca",
                "location": "Santos",
                "device": "mobile",
                "search": "exemplo.com",
            },
        )
    )

    assert response.status_code == 200
    assert captured == {
        "days": 90,
        "page": 2,
        "page_size": 50,
        "service": "Lei Seca",
        "location": "Santos",
        "device": "mobile",
        "search": "exemplo.com",
    }
    assert response.json()["metadata"]["scope"] == "observado"


def test_endpoint_perfil_expoe_abas_reais(monkeypatch) -> None:
    async def perfil_falso(_db, advertiser_id: int, **_kwargs) -> dict:
        return {
            "advertiser": {"advertiser_id": advertiser_id},
            "queries": [{"query_observed": "advogado lei seca"}],
            "landing_pages": [{"snapshot_count": 2, "latest_snapshot": {}}],
            "creatives": [{"queries_observed": ["advogado lei seca"]}],
            "timeline": [{"observed_day": "2026-07-20T00:00:00Z"}],
            "metadata": {"scope": "observado"},
        }

    monkeypatch.setattr(
        main_module,
        "obter_perfil_anunciante_observado",
        perfil_falso,
    )

    response = asyncio.run(_get("/api/radar/advertisers/7"))

    assert response.status_code == 200
    body = response.json()
    assert body["advertiser"]["advertiser_id"] == 7
    assert set(("queries", "landing_pages", "creatives", "timeline")) <= body.keys()


def test_endpoint_perfil_retorna_404_quando_nao_observado(monkeypatch) -> None:
    async def perfil_ausente(*_args, **_kwargs):
        return None

    monkeypatch.setattr(
        main_module,
        "obter_perfil_anunciante_observado",
        perfil_ausente,
    )

    response = asyncio.run(_get("/api/radar/advertisers/999"))

    assert response.status_code == 404
    assert "observado" in response.json()["detail"]


def test_endpoint_mapa_termos_limita_tamanho_da_pagina() -> None:
    response = asyncio.run(
        _get("/api/radar/term-map", params={"page_size": 201})
    )

    assert response.status_code == 422


def test_endpoint_snapshots_retorna_alias_simples(monkeypatch) -> None:
    async def snapshots_falsos(_db, landing_page_id: int, **_kwargs) -> dict:
        item = {"snapshot_id": 3, "measurement": "observado"}
        return {
            "landing_page": {"landing_page_id": landing_page_id},
            "snapshots": [item],
            "snapshots_observed": [item],
            "metadata": {"scope": "observado"},
        }

    monkeypatch.setattr(
        main_module,
        "listar_snapshots_landing_page",
        snapshots_falsos,
    )

    response = asyncio.run(
        _get(
            "/api/radar/landing-pages/11/snapshots",
            params={"page": 1, "page_size": 10},
        )
    )

    assert response.status_code == 200
    assert response.json()["snapshots"][0]["measurement"] == "observado"
