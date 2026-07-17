import os
from pathlib import Path

import httpx
from dotenv import load_dotenv


load_dotenv(Path(__file__).resolve().parents[1] / ".env")

SERPAPI_URL = "https://serpapi.com/search"


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
        "location": location,
        "device": device,
        "api_key": api_key,
        "hl": "pt",
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
