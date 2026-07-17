import os
import logging
from pathlib import Path
from urllib.parse import urlencode

import httpx
from dotenv import load_dotenv


load_dotenv(Path(__file__).resolve().parents[1] / ".env")

SERPAPI_URL = "https://serpapi.com/search"
logger = logging.getLogger(__name__)
SERPAPI_LOCATION_IDS = {
    "sao bernardo do campo": "585069a2ee19ad271e9b4f84",
    "são bernardo do campo": "585069a2ee19ad271e9b4f84",
}


def obter_localizacao_serpapi(location: str) -> str:
    return SERPAPI_LOCATION_IDS.get(location.strip().lower(), location)


async def buscar_anuncios_google(
    keyword: str,
    location: str,
    device: str,
) -> list[dict]:
    api_key = os.getenv("SERPAPI_KEY")

    if not api_key:
        return []

    params = {
        "engine": "google",
        "q": keyword,
        "location": obter_localizacao_serpapi(location),
        "device": device,
        "api_key": api_key,
        "google_domain": "google.com.br",
        "hl": "pt",
        "gl": "br",
    }
    params_para_log = {**params, "api_key": "[oculta]"}
    logger.info("SerpApi request: %s?%s", SERPAPI_URL, urlencode(params_para_log))

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(SERPAPI_URL, params=params)
            response.raise_for_status()
            resposta = response.json()
    except (httpx.RequestError, httpx.HTTPStatusError, ValueError):
        return []

    metadados = resposta.get("search_metadata") or {}
    parametros_usados = resposta.get("search_parameters") or {}
    logger.info(
        "SerpApi response: search_id=%s google_url=%s location_used=%s sections=%s ads=%s top_ads=%s bottom_ads=%s",
        metadados.get("id"),
        metadados.get("google_url"),
        parametros_usados.get("location_used"),
        sorted(resposta.keys()),
        len(resposta.get("ads") or []),
        len(resposta.get("top_ads") or []),
        len(resposta.get("bottom_ads") or []),
    )

    anuncios = resposta.get("ads")
    if isinstance(anuncios, list):
        return [anuncio for anuncio in anuncios if isinstance(anuncio, dict)]

    anuncios_topo = resposta.get("top_ads") or []
    anuncios_rodape = resposta.get("bottom_ads") or []
    return [
        anuncio
        for anuncio in [*anuncios_topo, *anuncios_rodape]
        if isinstance(anuncio, dict)
    ]
