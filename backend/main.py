from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_db
from backend.models import AdObservation, Advertiser, LandingPage, SearchRun
from backend.services.orchestrator import executar_varredura


class ScanRequest(BaseModel):
    keyword: str
    location: str
    device: str


app = FastAPI(title="Radar API")
RADAR_FRONTEND_PATH = Path(__file__).resolve().parent.parent / "frontend" / "radar_mockup.html"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def health_check() -> dict:
    return {"status": "Radar API Online"}


@app.get("/radar", include_in_schema=False)
async def radar_frontend() -> FileResponse:
    return FileResponse(RADAR_FRONTEND_PATH)


@app.get("/api/radar/observations")
async def listar_observacoes(
    db: AsyncSession = Depends(get_db),
) -> dict:
    consulta = (
        select(AdObservation, Advertiser, LandingPage, SearchRun)
        .join(Advertiser, AdObservation.advertiser_id == Advertiser.id)
        .outerjoin(LandingPage, AdObservation.landing_page_id == LandingPage.id)
        .join(SearchRun, AdObservation.search_run_id == SearchRun.id)
        .order_by(AdObservation.observed_at.desc())
        .limit(100)
    )
    resultado = await db.execute(consulta)

    observacoes = [
        {
            "id": observacao.id,
            "advertiser": anunciante.display_name or anunciante.domain,
            "domain": anunciante.domain,
            "title": observacao.title,
            "description": observacao.description,
            "position": observacao.position_index,
            "device": busca.device,
            "target_url": observacao.target_url,
            "landing_page_url": pagina.canonical_url if pagina else None,
            "observed_at": observacao.observed_at,
        }
        for observacao, anunciante, pagina, busca in resultado.all()
    ]

    return {"observations": observacoes}


@app.post("/api/radar/scan")
async def executar_scan(
    request: ScanRequest,
    db: AsyncSession = Depends(get_db),
) -> dict:
    try:
        resultado = await executar_varredura(
            db,
            request.keyword,
            request.location,
            request.device,
        )
        return {
            "status": "sucesso",
            "search_run_id": resultado.id,
            "ads_found": resultado.ads_found,
        }
    except Exception as erro:
        raise HTTPException(
            status_code=500,
            detail=f"Falha ao executar a varredura: {erro}",
        ) from erro
