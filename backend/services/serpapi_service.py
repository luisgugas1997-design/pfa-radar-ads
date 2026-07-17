import os
from pathlib import Path

import httpx
from dotenv import load_dotenv


load_dotenv(Path(__file__).resolve().parents[1] / ".env")

SERPAPI_URL = "https://serpapi.com/search"
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
        "hl": "pt-br",
        "gl": "br",
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(SERPAPI_URL, params=params)
            response.raise_for_status()
            resposta = response.json()
    except (httpx.RequestError, httpx.HTTPStatusError, ValueError):
        return []

    anuncios = resposta.get("ads")
    if isinstance(anuncios, list):
        return [anuncio for anuncio in anuncios if isinstance(anuncio, dict)]

    anuncios_topo = resposta.get("top_ads", [])
    anuncios_rodape = resposta.get("bottom_ads", [])
    return [
        anuncio
        for anuncio in [*anuncios_topo, *anuncios_rodape]
        if isinstance(anuncio, dict)
    ]
