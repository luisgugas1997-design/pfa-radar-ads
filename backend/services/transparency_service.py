import logging
import os
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urlencode

import httpx
from dotenv import load_dotenv
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models import (
    Advertiser,
    TransparencyCreativeObservation,
    TransparencyScan,
)


load_dotenv(Path(__file__).resolve().parents[1] / ".env")

SERPAPI_URL = "https://serpapi.com/search.json"
TRANSPARENCY_ENGINE = "google_ads_transparency_center"
TRANSPARENCY_REGION = "2076"
TRANSPARENCY_PLATFORM = "SEARCH"
TRANSPARENCY_RESULT_LABEL = "criativos encontrados na Transparência"
TRANSPARENCY_CAVEAT = (
    "Dados observados no Google Ads Transparency Center; não representam todos "
    "os anúncios ativos, campanhas, palavras-chave, investimento ou impressões "
    "do anunciante."
)
logger = logging.getLogger("uvicorn.error")


@dataclass(frozen=True, slots=True)
class ResultadoTransparency:
    raw_payload: dict[str, Any]
    provider_search_id: str | None
    total_results: int | None
    creatives: list[dict[str, Any]]
    next_page_token: str | None


def _inteiro_ou_none(valor: Any) -> int | None:
    if isinstance(valor, bool):
        return None
    try:
        return int(valor) if valor is not None else None
    except (TypeError, ValueError):
        return None


def _texto_ou_none(valor: Any, limite: int | None = None) -> str | None:
    if not isinstance(valor, str):
        return None
    texto = valor.strip()
    if not texto:
        return None
    return texto[:limite] if limite is not None else texto


def montar_parametros(
    advertiser: str,
    num: int,
    api_key: str,
) -> dict[str, str | int]:
    consulta = advertiser.strip() if isinstance(advertiser, str) else ""
    if not consulta:
        raise ValueError("O domínio do anunciante é obrigatório.")
    if len(consulta) > 255:
        raise ValueError("O domínio do anunciante deve ter no máximo 255 caracteres.")
    if isinstance(num, bool) or not isinstance(num, int) or not 1 <= num <= 100:
        raise ValueError("num deve ser um inteiro entre 1 e 100.")
    if not isinstance(api_key, str) or not api_key.strip():
        raise RuntimeError("SERPAPI_KEY não está configurada no servidor.")

    return {
        "engine": TRANSPARENCY_ENGINE,
        "text": consulta,
        "region": TRANSPARENCY_REGION,
        "platform": TRANSPARENCY_PLATFORM,
        "num": num,
        "no_cache": "false",
        "api_key": api_key.strip(),
    }


async def buscar_criativos_transparencia(
    advertiser: str,
    num: int = 100,
) -> ResultadoTransparency:
    api_key = os.getenv("SERPAPI_KEY") or os.getenv("SERPAPI_API_KEY")
    params = montar_parametros(advertiser, num, api_key or "")
    params_para_log = {**params, "api_key": "[oculta]"}
    logger.info(
        "SerpApi Transparency request: %s?%s",
        SERPAPI_URL,
        urlencode(params_para_log),
    )

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(SERPAPI_URL, params=params)
            response.raise_for_status()
            resposta = response.json()
    except httpx.HTTPStatusError as erro:
        detalhe = None
        try:
            corpo_erro = erro.response.json()
            if isinstance(corpo_erro, dict) and corpo_erro.get("error"):
                detalhe = str(corpo_erro["error"])[:500]
        except ValueError:
            detalhe = None
        sufixo = f": {detalhe}" if detalhe else ""
        raise RuntimeError(
            f"A SerpApi respondeu com HTTP {erro.response.status_code}{sufixo}."
        ) from erro
    except httpx.RequestError as erro:
        raise RuntimeError("Falha de rede ao consultar a SerpApi.") from erro
    except ValueError as erro:
        raise RuntimeError("A SerpApi retornou uma resposta JSON inválida.") from erro

    if not isinstance(resposta, dict):
        raise RuntimeError("A SerpApi retornou uma estrutura JSON inesperada.")
    if resposta.get("error"):
        raise RuntimeError(
            f"Erro retornado pela SerpApi: {str(resposta['error'])[:500]}"
        )

    metadados = resposta.get("search_metadata") or {}
    informacoes = resposta.get("search_information") or {}
    paginacao = resposta.get("serpapi_pagination") or {}
    criativos = resposta.get("ad_creatives") or []

    if not isinstance(metadados, dict):
        metadados = {}
    if not isinstance(informacoes, dict):
        informacoes = {}
    if not isinstance(paginacao, dict):
        paginacao = {}
    if not isinstance(criativos, list):
        raise RuntimeError(
            "A SerpApi retornou ad_creatives em formato inesperado."
        )

    return ResultadoTransparency(
        raw_payload=resposta,
        provider_search_id=_texto_ou_none(metadados.get("id"), 120),
        total_results=_inteiro_ou_none(informacoes.get("total_results")),
        creatives=[item for item in criativos if isinstance(item, dict)],
        next_page_token=_texto_ou_none(paginacao.get("next_page_token")),
    )


def _identificar_anunciante_local(advertiser: Advertiser) -> tuple[int, str]:
    advertiser_id = getattr(advertiser, "id", None)
    dominio = getattr(advertiser, "domain", None)
    if (
        isinstance(advertiser_id, bool)
        or not isinstance(advertiser_id, int)
        or advertiser_id <= 0
    ):
        raise ValueError("O anunciante local precisa estar persistido antes da consulta.")
    if not isinstance(dominio, str) or not dominio.strip():
        raise ValueError("O anunciante local precisa ter um domínio válido.")
    consulta = dominio.strip()
    if len(consulta) > 255:
        raise ValueError("O domínio do anunciante deve ter no máximo 255 caracteres.")
    return advertiser_id, consulta


async def executar_transparency_scan(
    session: AsyncSession,
    advertiser: Advertiser,
    num: int = 100,
    advertiser_query: str | None = None,
) -> TransparencyScan:
    advertiser_id, dominio = _identificar_anunciante_local(advertiser)
    consulta = (
        advertiser_query.strip()
        if isinstance(advertiser_query, str) and advertiser_query.strip()
        else dominio
    )
    if len(consulta) > 255:
        raise ValueError("A consulta do anunciante deve ter no máximo 255 caracteres.")
    if isinstance(num, bool) or not isinstance(num, int) or not 1 <= num <= 100:
        raise ValueError("num deve ser um inteiro entre 1 e 100.")

    scan = TransparencyScan(
        advertiser_id=advertiser_id,
        advertiser_query=consulta,
        provider="serpapi",
        engine=TRANSPARENCY_ENGINE,
        region=TRANSPARENCY_REGION,
        platform=TRANSPARENCY_PLATFORM,
        requested_num=num,
        status="pending",
        creatives_found=0,
        raw_payload={},
    )
    session.add(scan)
    await session.commit()
    await session.refresh(scan)
    scan_id = scan.id

    provider_search_id = None
    raw_payload: dict[str, Any] | None = None
    try:
        resultado = await buscar_criativos_transparencia(consulta, num)
        provider_search_id = resultado.provider_search_id
        raw_payload = resultado.raw_payload
        scan.provider_search_id = provider_search_id
        scan.total_results = resultado.total_results
        scan.next_page_token = resultado.next_page_token
        scan.raw_payload = resultado.raw_payload

        chaves_vistas: set[tuple[str, str]] = set()
        criativos_persistidos = 0
        for criativo in resultado.creatives:
            google_advertiser_id = _texto_ou_none(
                criativo.get("advertiser_id"), 40
            )
            ad_creative_id = _texto_ou_none(criativo.get("ad_creative_id"), 40)
            if google_advertiser_id is None or ad_creative_id is None:
                continue

            chave = (google_advertiser_id, ad_creative_id)
            if chave in chaves_vistas:
                continue
            chaves_vistas.add(chave)

            session.add(
                TransparencyCreativeObservation(
                    scan_id=scan_id,
                    google_advertiser_id=google_advertiser_id,
                    ad_creative_id=ad_creative_id,
                    advertiser_name=_texto_ou_none(
                        criativo.get("advertiser"), 255
                    ),
                    target_domain=_texto_ou_none(
                        criativo.get("target_domain"), 255
                    ),
                    creative_format=_texto_ou_none(criativo.get("format"), 20),
                    image_url=_texto_ou_none(criativo.get("image")),
                    preview_link=_texto_ou_none(criativo.get("link")),
                    width=_inteiro_ou_none(criativo.get("width")),
                    height=_inteiro_ou_none(criativo.get("height")),
                    first_shown_epoch=_inteiro_ou_none(
                        criativo.get("first_shown")
                    ),
                    last_shown_epoch=_inteiro_ou_none(
                        criativo.get("last_shown")
                    ),
                    details_link=_texto_ou_none(criativo.get("details_link")),
                    serpapi_details_link=_texto_ou_none(
                        criativo.get("serpapi_details_link")
                    ),
                    raw_payload=criativo,
                )
            )
            criativos_persistidos += 1

        scan.status = "completed"
        scan.creatives_found = criativos_persistidos
        scan.completed_at = datetime.now(timezone.utc)
        await session.commit()
        await session.refresh(scan)
        return scan

    except Exception as erro:
        await session.rollback()
        scan_falhou = await session.get(TransparencyScan, scan_id)
        if scan_falhou is None:
            raise

        scan_falhou.status = "failed"
        scan_falhou.provider_search_id = provider_search_id
        scan_falhou.completed_at = datetime.now(timezone.utc)
        scan_falhou.error_message = str(erro)[:2000]
        if raw_payload is not None:
            scan_falhou.raw_payload = raw_payload
        await session.commit()
        raise


def resumir_transparency_scan(scan: TransparencyScan) -> dict[str, Any]:
    return {
        "id": scan.id,
        "advertiser_id": scan.advertiser_id,
        "advertiser_query": scan.advertiser_query,
        "status": scan.status,
        "label": TRANSPARENCY_RESULT_LABEL,
        "creatives_found": scan.creatives_found,
        "total_results": scan.total_results,
        "has_next_page": bool(scan.next_page_token),
        "requested_at": _datetime_iso(scan.requested_at),
        "completed_at": _datetime_iso(scan.completed_at),
        "error_message": scan.error_message,
    }


def _datetime_iso(valor: Any) -> str | None:
    return valor.isoformat() if isinstance(valor, datetime) else None


async def obter_transparency_do_anunciante(
    session: AsyncSession,
    advertiser_id: int,
    limit: int = 100,
) -> dict[str, Any]:
    if (
        isinstance(advertiser_id, bool)
        or not isinstance(advertiser_id, int)
        or advertiser_id <= 0
    ):
        raise ValueError("advertiser_id deve ser um inteiro positivo.")
    if isinstance(limit, bool) or not isinstance(limit, int) or not 1 <= limit <= 100:
        raise ValueError("limit deve ser um inteiro entre 1 e 100.")

    historico_resultado = await session.scalars(
        select(TransparencyScan)
        .where(TransparencyScan.advertiser_id == advertiser_id)
        .order_by(TransparencyScan.requested_at.desc(), TransparencyScan.id.desc())
        .limit(10)
    )
    scans = list(historico_resultado.all())

    observacao = TransparencyCreativeObservation
    scan = TransparencyScan
    ranqueadas = (
        select(
            observacao.id.label("id"),
            observacao.scan_id.label("scan_id"),
            observacao.google_advertiser_id.label("google_advertiser_id"),
            observacao.ad_creative_id.label("ad_creative_id"),
            observacao.advertiser_name.label("advertiser_name"),
            observacao.target_domain.label("target_domain"),
            observacao.creative_format.label("creative_format"),
            observacao.image_url.label("image_url"),
            observacao.preview_link.label("preview_link"),
            observacao.width.label("width"),
            observacao.height.label("height"),
            observacao.first_shown_epoch.label("first_shown_epoch"),
            observacao.last_shown_epoch.label("last_shown_epoch"),
            observacao.details_link.label("details_link"),
            observacao.observed_at.label("observed_at"),
            scan.requested_at.label("scan_requested_at"),
            func.row_number()
            .over(
                partition_by=observacao.ad_creative_id,
                order_by=(observacao.observed_at.desc(), observacao.id.desc()),
            )
            .label("observation_rank"),
        )
        .join(scan, scan.id == observacao.scan_id)
        .where(scan.advertiser_id == advertiser_id)
        .subquery()
    )
    observacoes_resultado = await session.execute(
        select(ranqueadas)
        .where(ranqueadas.c.observation_rank == 1)
        .order_by(ranqueadas.c.observed_at.desc(), ranqueadas.c.id.desc())
        .limit(limit)
    )

    criativos = []
    for linha in observacoes_resultado.mappings().all():
        criativos.append(
            {
                "id": linha["id"],
                "scan_id": linha["scan_id"],
                "google_advertiser_id": linha["google_advertiser_id"],
                "ad_creative_id": linha["ad_creative_id"],
                "advertiser_name": linha["advertiser_name"],
                "target_domain": linha["target_domain"],
                "creative_format": linha["creative_format"],
                "image_url": linha["image_url"],
                "preview_link": linha["preview_link"],
                "width": linha["width"],
                "height": linha["height"],
                "first_shown_epoch": linha["first_shown_epoch"],
                "last_shown_epoch": linha["last_shown_epoch"],
                "details_link": linha["details_link"],
                "observed_at": _datetime_iso(linha["observed_at"]),
                "scan_requested_at": _datetime_iso(linha["scan_requested_at"]),
            }
        )

    latest_scan = resumir_transparency_scan(scans[0]) if scans else None
    return {
        "advertiser_id": advertiser_id,
        "latest_scan": latest_scan,
        "creatives": criativos,
        "scan_history": [resumir_transparency_scan(item) for item in scans],
        "measurement": {
            "label": TRANSPARENCY_RESULT_LABEL,
            "definition": (
                "Criativos únicos pela ad_creative_id, usando a observação mais "
                "recente armazenada para este perfil."
            ),
            "returned_unique_creatives": len(criativos),
            "limit": limit,
        },
        "caveat": TRANSPARENCY_CAVEAT,
    }
