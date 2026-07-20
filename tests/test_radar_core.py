import asyncio
import os
from datetime import datetime, timezone
from pathlib import Path
from types import SimpleNamespace
from urllib.parse import quote

import httpx
import pytest


os.environ.setdefault(
    "DATABASE_URL",
    "postgresql+asyncpg://radar:radar@127.0.0.1:5432/radar_test",
)
os.environ.setdefault("RADAR_ACCESS_USER", "radar-test")
os.environ.setdefault("RADAR_ACCESS_PASSWORD", "senha-test")

import backend.main as main_module
import backend.services.orchestrator as orchestrator_module
from backend.main import app
from backend.services.dashboard_service import (
    _assinatura_anuncio,
    _corresponde_janela_horaria,
    _nomes_historicos_do_servico,
)
from backend.services.orchestrator import extrair_url_destino
from backend.services.scraper import capturar_landing_page
from backend.services.search_planner import criar_plano_busca
from backend.services.serpapi_service import montar_parametros_busca


def test_frontend_local_redireciona_para_painel_https() -> None:
    html = (
        Path(__file__).resolve().parent.parent
        / "frontend"
        / "radar_mockup.html"
    ).read_text(encoding="utf-8")

    assert 'window.location.protocol === "file:"' in html
    assert (
        'window.location.replace('
        '"https://chatwoot-radar-api.phqoes.easypanel.host/radar"'
        ")"
    ) in html
    assert '"http://localhost:8000"' not in html
    assert 'id="time-window-filter"' in html
    assert 'id="pressure-chart"' in html
    assert 'id="opportunity-table"' in html
    assert 'id="message-library"' in html
    assert 'id="credit-cost-warning"' in html
    assert "créditos que serão consumidos" in html


def test_janelas_criticas_usam_fuso_de_sao_paulo() -> None:
    # Segunda-feira 14h em São Paulo.
    assert _corresponde_janela_horaria(
        datetime(2026, 7, 20, 17, 0, tzinfo=timezone.utc), "commercial"
    )
    # Domingo 02h em São Paulo pertence à noite de blitz iniciada no sábado.
    assert _corresponde_janela_horaria(
        datetime(2026, 7, 19, 5, 0, tzinfo=timezone.utc), "blitz"
    )
    assert not _corresponde_janela_horaria(
        datetime(2026, 7, 20, 17, 0, tzinfo=timezone.utc), "blitz"
    )


def test_plano_economico_nao_executa_e_calcula_creditos() -> None:
    plano = criar_plano_busca(
        service="Lei Seca",
        locations="São Bernardo do Campo,Santo André",
        devices="mobile",
        mode="economico",
    )

    assert plano["estimated_credits"] == len(plano["matrix"])
    assert plano["estimated_credits"] == 6
    assert all(item["estimated_credits"] == 1 for item in plano["matrix"])


def test_parametros_serpapi_usam_localizacao_e_idioma_canonicos() -> None:
    parametros = montar_parametros_busca(
        "defesa lei seca",
        "São Bernardo do Campo",
        "mobile",
        "chave-teste",
    )

    assert parametros["engine"] == "google_ads"
    assert parametros["location"] == (
        "Sao Bernardo do Campo,State of Sao Paulo,Brazil"
    )
    assert parametros["hl"] == "pt"
    assert parametros["gl"] == "br"
    assert parametros["google_domain"] == "google.com.br"
    assert parametros["no_cache"] == "false"


def test_plano_completo_respeita_limite_de_24_creditos() -> None:
    plano = criar_plano_busca(
        service="Suspensão da CNH",
        locations="São Bernardo do Campo,Santo André",
        devices="mobile,desktop",
        mode="completo",
    )

    assert plano["estimated_credits"] == 24
    assert plano["limited"] is True
    assert plano["omitted_keywords"]
    assert {item["location"] for item in plano["matrix"]} == {
        "São Bernardo do Campo",
        "Santo André",
    }
    assert {item["device"] for item in plano["matrix"]} == {
        "mobile",
        "desktop",
    }


def test_plano_rejeita_dispositivo_invalido() -> None:
    with pytest.raises(ValueError, match="Dispositivos aceitos"):
        criar_plano_busca(
            service="Lei Seca",
            locations="Santos",
            devices="televisao",
            mode="economico",
        )


def test_assinatura_de_anuncio_e_estavel_entre_varreduras() -> None:
    primeira = SimpleNamespace(
        title="Defesa Lei Seca",
        description="Análise do caso",
        target_url="https://exemplo.com/lei-seca",
    )
    segunda = SimpleNamespace(
        title="  DEFESA   LEI SECA ",
        description="análise do caso",
        target_url="https://exemplo.com/lei-seca",
    )

    assert _assinatura_anuncio(primeira) == _assinatura_anuncio(segunda)


def test_assinatura_ignora_parametros_comuns_de_rastreamento() -> None:
    primeira = SimpleNamespace(
        title="Defesa Lei Seca",
        description="Análise do caso",
        target_url="https://exemplo.com/lei-seca?utm_source=google&gclid=abc",
    )
    segunda = SimpleNamespace(
        title="Defesa Lei Seca",
        description="Análise do caso",
        target_url="https://exemplo.com/lei-seca",
    )

    assert _assinatura_anuncio(primeira) == _assinatura_anuncio(segunda)


def test_filtro_de_servico_inclui_variacoes_historicas() -> None:
    nomes = _nomes_historicos_do_servico("Lei Seca")

    assert "lei seca" in nomes
    assert "recusa bafômetro" in nomes
    assert "recusa ao bafômetro" in nomes
    assert "advogado lei seca" in nomes


def test_extrai_destino_sem_expor_link_de_clique_google() -> None:
    destino = "https://concorrente.example/landing?origem=radar"
    rastreador = f"https://www.google.com/aclk?adurl={quote(destino, safe='')}"

    assert extrair_url_destino(rastreador) == destino
    assert extrair_url_destino("javascript:alert(1)") is None


def test_scraper_rejeita_url_nao_http_sem_abrir_navegador() -> None:
    resultado = asyncio.run(capturar_landing_page("file:///etc/passwd"))

    assert resultado["status"] == "erro"
    assert "HTTP" in resultado["erro"]


def test_scraper_rejeita_endereco_privado_sem_abrir_navegador() -> None:
    resultado = asyncio.run(capturar_landing_page("http://127.0.0.1/admin"))

    assert resultado["status"] == "erro"
    assert "público" in resultado["erro"]


def test_endpoint_de_plano_reflete_o_contrato_publico() -> None:
    async def executar() -> httpx.Response:
        transporte = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(
            transport=transporte,
            base_url="http://testserver",
            auth=("radar-test", "senha-test"),
        ) as cliente:
            return await cliente.get(
                "/api/radar/search-plan",
                params={
                    "service": "Lei Seca",
                    "locations": "São Bernardo do Campo",
                    "devices": "mobile",
                    "mode": "economico",
                },
            )

    resposta = asyncio.run(executar())

    assert resposta.status_code == 200
    corpo = resposta.json()
    assert corpo["estimated_credits"] == len(corpo["matrix"])
    assert corpo["estimated_credits"] > 0


def test_endpoint_radar_rejeita_acesso_sem_credenciais() -> None:
    async def executar() -> httpx.Response:
        transporte = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(
            transport=transporte,
            base_url="http://testserver",
        ) as cliente:
            return await cliente.get(
                "/api/radar/search-plan",
                params={
                    "service": "Lei Seca",
                    "locations": "São Bernardo do Campo",
                },
            )

    resposta = asyncio.run(executar())

    assert resposta.status_code == 401
    assert resposta.headers["www-authenticate"] == 'Basic realm="Radar PFA"'


def test_endpoint_dashboard_aceita_periodo_de_30_dias(monkeypatch) -> None:
    async def dashboard_falso(*_args, days: int, **_kwargs) -> dict:
        return {"period_days": days}

    monkeypatch.setattr(main_module, "construir_dashboard", dashboard_falso)

    async def executar() -> httpx.Response:
        transporte = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(
            transport=transporte,
            base_url="http://testserver",
            auth=("radar-test", "senha-test"),
        ) as cliente:
            return await cliente.get(
                "/api/radar/dashboard",
                params={"days": "30", "service": "Lei Seca"},
            )

    resposta = asyncio.run(executar())

    assert resposta.status_code == 200
    assert resposta.json() == {"period_days": 30}


def test_orquestrador_preserva_erro_original_apos_rollback(monkeypatch) -> None:
    class SearchRunFalso:
        def __init__(self, **dados) -> None:
            self.__dict__.update(dados)
            self._id = None
            self.expirado = False
            self.error_message = None
            self.provider_search_id = None

        @property
        def id(self):
            if self.expirado:
                raise RuntimeError("objeto expirado")
            return self._id

        @id.setter
        def id(self, valor) -> None:
            self._id = valor

    class SessaoFalsa:
        def __init__(self) -> None:
            self.search_run = None

        def add(self, objeto) -> None:
            self.search_run = objeto

        async def commit(self) -> None:
            return None

        async def refresh(self, objeto) -> None:
            objeto.id = 42

        async def rollback(self) -> None:
            self.search_run.expirado = True

        async def get(self, _model, identificador):
            assert identificador == 42
            self.search_run.expirado = False
            return self.search_run

    async def busca_com_falha(*_args, **_kwargs):
        raise RuntimeError("erro original da coleta")

    monkeypatch.setattr(orchestrator_module, "SearchRun", SearchRunFalso)
    monkeypatch.setattr(
        orchestrator_module,
        "buscar_anuncios_google",
        busca_com_falha,
    )
    sessao = SessaoFalsa()

    with pytest.raises(RuntimeError, match="erro original da coleta"):
        asyncio.run(
            orchestrator_module.executar_varredura(
                sessao,
                "defesa lei seca",
                "São Bernardo do Campo",
                "mobile",
                service_name="Lei Seca",
            )
        )

    assert sessao.search_run.status == "failed"
    assert sessao.search_run.error_message == "erro original da coleta"
