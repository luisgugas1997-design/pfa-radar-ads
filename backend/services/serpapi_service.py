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
logger = logging.getLogger("uvicorn.error")
SERPAPI_LOCATION_IDS = {
    "sao bernardo do campo": "585069a2ee19ad271e9b4f84",
}


@dataclass(frozen=True, slots=True)
class ResultadoSerpApi:
    anuncios: list[dict[str, Any]]
    search_id: str | None


def obter_localizacao_serpapi(location: str) -> str:
    chave = unicodedata.normalize("NFKD", location.strip().casefold())
    chave = chave.encode("ascii", "ignore").decode("ascii")
    return SERPAPI_LOCATION_IDS.get(chave, location)


async def buscar_anuncios_google(
    keyword: str,
    location: str,
    device: str,
) -> ResultadoSerpApi:
    api_key = os.getenv("SERPAPI_KEY") or os.getenv("SERPAPI_API_KEY")

    if not api_key:
        raise RuntimeError("SERPAPI_KEY não está configurada no servidor.")

    params = {
        "engine": "google_ads",
        "q": keyword,
        "location": obter_localizacao_serpapi(location),
        "device": device,
        "api_key": api_key,
        "hl": "pt",
        "no_cache": "true",
    }
    params_para_log = {**params, "api_key": "[oculta]"}
    logger.info("SerpApi request: %s?%s", SERPAPI_URL, urlencode(params_para_log))

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(SERPAPI_URL, params=params)
            response.raise_for_status()
            resposta = response.json()
    except httpx.HTTPStatusError as erro:
        raise RuntimeError(
            f"A SerpApi respondeu com HTTP {erro.response.status_code}."
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
