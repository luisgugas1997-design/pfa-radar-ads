import asyncio
from datetime import datetime, timezone

import httpx
import pytest

from backend.models import (
    Advertiser,
    TransparencyCreativeObservation,
    TransparencyScan,
)
import backend.services.transparency_service as transparency_module
from backend.services.transparency_service import (
    ResultadoTransparency,
    buscar_criativos_transparencia,
    executar_transparency_scan,
    montar_parametros,
    obter_transparency_do_anunciante,
    resumir_transparency_scan,
)


class SessaoFalsa:
    def __init__(self) -> None:
        self.scan: TransparencyScan | None = None
        self.observations: list[TransparencyCreativeObservation] = []
        self.commits = 0
        self.rollbacks = 0

    def add(self, objeto) -> None:
        if isinstance(objeto, TransparencyScan):
            self.scan = objeto
        elif isinstance(objeto, TransparencyCreativeObservation):
            self.observations.append(objeto)

    async def commit(self) -> None:
        self.commits += 1

    async def refresh(self, objeto) -> None:
        if isinstance(objeto, TransparencyScan) and objeto.id is None:
            objeto.id = 91

    async def rollback(self) -> None:
        self.rollbacks += 1
        self.observations.clear()

    async def get(self, model, identificador):
        assert model is TransparencyScan
        assert identificador == 91
        return self.scan


def test_montar_parametros_usa_contrato_oficial_e_uma_pagina() -> None:
    parametros = montar_parametros("concorrente.example", 100, "chave-teste")

    assert parametros == {
        "engine": "google_ads_transparency_center",
        "text": "concorrente.example",
        "region": "2076",
        "platform": "SEARCH",
        "num": 100,
        "no_cache": "false",
        "api_key": "chave-teste",
    }
    assert "next_page_token" not in parametros
    assert "device" not in parametros


@pytest.mark.parametrize("num", [0, 101, True, 1.5])
def test_montar_parametros_rejeita_num_fora_do_contrato(num) -> None:
    with pytest.raises(ValueError, match="entre 1 e 100"):
        montar_parametros("concorrente.example", num, "chave-teste")


def test_busca_transparency_usa_alias_e_faz_uma_unica_requisicao(
    monkeypatch,
) -> None:
    chamadas: list[tuple[str, dict]] = []
    payload = {
        "search_metadata": {"id": "search-123", "status": "Success"},
        "search_information": {"total_results": 12},
        "ad_creatives": [
            {
                "advertiser_id": "AR123",
                "advertiser": "Concorrente",
                "ad_creative_id": "CR123",
                "format": "text",
                "target_domain": "concorrente.example",
            }
        ],
        "serpapi_pagination": {"next_page_token": "pagina-seguinte"},
    }

    class ClienteFalso:
        def __init__(self, *_args, **_kwargs) -> None:
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *_args) -> None:
            return None

        async def get(self, url, params):
            chamadas.append((url, dict(params)))
            return httpx.Response(
                200,
                json=payload,
                request=httpx.Request("GET", url),
            )

    monkeypatch.delenv("SERPAPI_KEY", raising=False)
    monkeypatch.setenv("SERPAPI_API_KEY", "alias-secreto")
    monkeypatch.setattr(transparency_module.httpx, "AsyncClient", ClienteFalso)

    resultado = asyncio.run(
        buscar_criativos_transparencia("concorrente.example", num=40)
    )

    assert len(chamadas) == 1
    assert chamadas[0][1]["api_key"] == "alias-secreto"
    assert chamadas[0][1]["num"] == 40
    assert resultado.provider_search_id == "search-123"
    assert resultado.total_results == 12
    assert resultado.next_page_token == "pagina-seguinte"
    assert len(resultado.creatives) == 1


def test_executar_scan_persiste_criativos_unicos_por_scan(monkeypatch) -> None:
    criativo = {
        "advertiser_id": "AR123",
        "advertiser": "Concorrente",
        "ad_creative_id": "CR123",
        "format": "text",
        "target_domain": "concorrente.example",
        "image": "https://images.example/preview.png",
        "width": 380,
        "height": 239,
        "first_shown": 1700000000,
        "last_shown": 1700100000,
        "details_link": "https://adstransparency.google/creative/CR123",
        "serpapi_details_link": "https://serpapi.com/search.json?creative_id=CR123",
    }
    resposta = ResultadoTransparency(
        raw_payload={"ad_creatives": [criativo, criativo]},
        provider_search_id="search-123",
        total_results=2,
        creatives=[criativo, criativo, {"advertiser_id": "AR-sem-criativo"}],
        next_page_token="proxima-pagina-nao-consumida",
    )

    async def busca_falsa(*_args, **_kwargs) -> ResultadoTransparency:
        return resposta

    monkeypatch.setattr(
        transparency_module,
        "buscar_criativos_transparencia",
        busca_falsa,
    )
    advertiser = Advertiser(
        id=7,
        display_name="Concorrente local",
        domain="concorrente.example",
    )
    session = SessaoFalsa()

    scan = asyncio.run(executar_transparency_scan(session, advertiser, num=100))

    assert scan.advertiser_id == 7
    assert scan.advertiser_query == "concorrente.example"
    assert scan.status == "completed"
    assert scan.creatives_found == 1
    assert scan.total_results == 2
    assert scan.next_page_token == "proxima-pagina-nao-consumida"
    assert len(session.observations) == 1
    assert session.observations[0].scan_id == 91
    assert session.observations[0].ad_creative_id == "CR123"
    assert session.commits == 2
    assert session.rollbacks == 0

    resumo = resumir_transparency_scan(scan)
    assert resumo["label"] == "criativos encontrados na Transparência"
    assert resumo["has_next_page"] is True


def test_executar_scan_preserva_status_failed_e_erro_original(monkeypatch) -> None:
    async def busca_com_falha(*_args, **_kwargs):
        raise RuntimeError("falha controlada da SerpApi")

    monkeypatch.setattr(
        transparency_module,
        "buscar_criativos_transparencia",
        busca_com_falha,
    )
    advertiser = Advertiser(
        id=8,
        display_name="Concorrente local",
        domain="falha.example",
    )
    session = SessaoFalsa()

    with pytest.raises(RuntimeError, match="falha controlada da SerpApi"):
        asyncio.run(executar_transparency_scan(session, advertiser, num=20))

    assert session.scan is not None
    assert session.scan.status == "failed"
    assert session.scan.error_message == "falha controlada da SerpApi"
    assert session.scan.completed_at is not None
    assert session.commits == 2
    assert session.rollbacks == 1
    assert session.observations == []


def test_helper_de_perfil_retorna_contrato_serializavel_sem_payload_sensivel() -> None:
    agora = datetime(2026, 7, 20, 12, 0, tzinfo=timezone.utc)
    scan = TransparencyScan(
        id=91,
        advertiser_id=7,
        advertiser_query="concorrente.example",
        provider="serpapi",
        engine="google_ads_transparency_center",
        region="2076",
        platform="SEARCH",
        requested_num=100,
        status="completed",
        provider_search_id="search-123",
        total_results=12,
        creatives_found=1,
        next_page_token=None,
        requested_at=agora,
        completed_at=agora,
        error_message=None,
        raw_payload={"nao": "expor"},
    )
    linhas = [
        {
            "id": 201,
            "scan_id": 91,
            "google_advertiser_id": "AR123",
            "ad_creative_id": "CR123",
            "advertiser_name": "Concorrente",
            "target_domain": "concorrente.example",
            "creative_format": "text",
            "image_url": "https://images.example/preview.png",
            "preview_link": None,
            "width": 380,
            "height": 239,
            "first_shown_epoch": 1700000000,
            "last_shown_epoch": 1700100000,
            "details_link": "https://adstransparency.google/creative/CR123",
            "serpapi_details_link": "nao-deve-sair",
            "observed_at": agora,
            "scan_requested_at": agora,
            "observation_rank": 1,
            "raw_payload": {"nao": "expor"},
        }
    ]

    class EscalaresFalsos:
        def all(self):
            return [scan]

    class MapeamentosFalsos:
        def mappings(self):
            return self

        def all(self):
            return linhas

    class SessaoLeituraFalsa:
        async def scalars(self, _consulta):
            return EscalaresFalsos()

        async def execute(self, _consulta):
            return MapeamentosFalsos()

    resultado = asyncio.run(
        obter_transparency_do_anunciante(
            SessaoLeituraFalsa(),
            advertiser_id=7,
            limit=100,
        )
    )

    assert resultado["latest_scan"]["requested_at"] == agora.isoformat()
    assert resultado["measurement"]["returned_unique_creatives"] == 1
    assert resultado["measurement"]["label"] == (
        "criativos encontrados na Transparência"
    )
    assert "não representam todos os anúncios ativos" in resultado["caveat"]
    assert "raw_payload" not in resultado["latest_scan"]
    assert "raw_payload" not in resultado["creatives"][0]
    assert "serpapi_details_link" not in resultado["creatives"][0]
