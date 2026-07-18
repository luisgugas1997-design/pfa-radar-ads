import os
import logging
import unicodedata
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from urllib.parse import urlencode

import httpx
from dotenv import load_dotenv


load_dotenv(Path(__file__).resolve().parents[1] / ".env")

SERPAPI_URL = "https://serpapi.com/search"
SERPAPI_ACCOUNT_URL = "https://serpapi.com/account.json"
logger = logging.getLogger("uvicorn.error")
SERPAPI_LOCATIONS = {
    "sao bernardo do campo": "Sao Bernardo do Campo,State of Sao Paulo,Brazil",
}


@dataclass(frozen=True, slots=True)
class ResultadoSerpApi:
    anuncios: list[dict[str, Any]]
    search_id: str | None


def _inteiro_ou_none(valor: Any) -> int | None:
    try:
        return int(valor) if valor is not None else None
    except (TypeError, ValueError):
        return None


def obter_localizacao_serpapi(location: str) -> str:
    chave = unicodedata.normalize("NFKD", location.strip().casefold())
    chave = chave.encode("ascii", "ignore").decode("ascii")
    return SERPAPI_LOCATIONS.get(chave, location)


def montar_parametros_busca(
    keyword: str,
    location: str,
    device: str,
    api_key: str,
) -> dict[str, str]:
    return {
        "engine": "google_ads",
        "q": keyword,
        "location": obter_localizacao_serpapi(location),
        "device": device,
        "api_key": api_key,
        "google_domain": "google.com.br",
        "gl": "br",
        "hl": "pt",
        "no_cache": "false",
    }


async def buscar_anuncios_google(
    keyword: str,
    location: str,
    device: str,
) -> ResultadoSerpApi:
    api_key = os.getenv("SERPAPI_KEY") or os.getenv("SERPAPI_API_KEY")

    if not api_key:
        raise RuntimeError("SERPAPI_KEY não está configurada no servidor.")

    params = montar_parametros_busca(keyword, location, device, api_key)
    params_para_log = {**params, "api_key": "[oculta]"}
    logger.info("SerpApi request: %s?%s", SERPAPI_URL, urlencode(params_para_log))

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
        raise RuntimeError(f"Erro retornado pela SerpApi: {str(resposta['error'])[:500]}")

    metadados = resposta.get("search_metadata") or {}
    parametros_usados = resposta.get("search_parameters") or {}
    logger.info(
        "SerpApi response: search_id=%s google_ads_url=%s location_used=%s sections=%s ads=%s",
        metadados.get("id"),
        metadados.get("google_ads_url"),
        parametros_usados.get("location_used"),
        sorted(resposta.keys()),
        len(resposta.get("ads") or []),
    )

    anuncios = resposta.get("ads") or []
    if not isinstance(anuncios, list):
        raise RuntimeError("A SerpApi retornou o campo ads em formato inesperado.")

    return ResultadoSerpApi(
        anuncios=[anuncio for anuncio in anuncios if isinstance(anuncio, dict)],
        search_id=metadados.get("id"),
    )


async def obter_cota_serpapi() -> dict[str, Any]:
    api_key = os.getenv("SERPAPI_KEY") or os.getenv("SERPAPI_API_KEY")
    if not api_key:
        raise RuntimeError("SERPAPI_KEY não está configurada no servidor.")

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(
                SERPAPI_ACCOUNT_URL,
                params={"api_key": api_key},
            )
            response.raise_for_status()
            dados = response.json()
    except httpx.HTTPStatusError as erro:
        raise RuntimeError(
            f"A SerpApi respondeu com HTTP {erro.response.status_code} ao consultar a cota."
        ) from erro
    except httpx.RequestError as erro:
        raise RuntimeError("Falha de rede ao consultar a cota da SerpApi.") from erro
    except ValueError as erro:
        raise RuntimeError("A SerpApi retornou uma cota em formato inválido.") from erro

    if not isinstance(dados, dict):
        raise RuntimeError("A SerpApi retornou uma estrutura de cota inesperada.")
    if dados.get("error"):
        raise RuntimeError(f"Erro retornado pela SerpApi: {str(dados['error'])[:300]}")

    restante = dados.get("total_searches_left")
    if restante is None:
        restante = dados.get("plan_searches_left")

    return {
        "status": "available",
        "monthly_limit": _inteiro_ou_none(dados.get("searches_per_month")),
        "used": _inteiro_ou_none(dados.get("this_month_usage")),
        "remaining": _inteiro_ou_none(restante),
        "renewal": dados.get("plan_renewal_date"),
    }
