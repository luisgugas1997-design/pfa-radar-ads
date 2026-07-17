from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.services.scraper import capturar_landing_page


class ScrapeRequest(BaseModel):
    url: str


router = APIRouter()


@router.post("/api/radar/scrape-landing")
async def scrape_landing(request: ScrapeRequest) -> dict:
    try:
        return await capturar_landing_page(request.url)
    except Exception as erro:
        raise HTTPException(
            status_code=500,
            detail=f"Não foi possível capturar a landing page: {erro}",
        ) from erro
