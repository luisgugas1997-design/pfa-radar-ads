from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import engine, get_db, initialize_database
from backend.models import AdObservation, Advertiser, LandingPage, SearchRun
from backend.services.orchestrator import executar_varredura


class ScanRequest(BaseModel):
    keyword: str
    location: str
    device: str


@asynccontextmanager
async def lifespan(_: FastAPI):
    await initialize_database()
    yield
    await engine.dispose()


app = FastAPI(title="Radar API", lifespan=lifespan)
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
    search_run_id: int | None = Query(default=None, ge=1),
    db: AsyncSession = Depends(get_db),
) -> dict:
    busca_selecionada = None
    if search_run_id is not None:
        busca_selecionada = await db.get(SearchRun, search_run_id)
        if busca_selecionada is None:
            raise HTTPException(status_code=404, detail="Pesquisa não encontrada.")

    consulta = (
        select(AdObservation, Advertiser, LandingPage, SearchRun)
        .join(Advertiser, AdObservation.advertiser_id == Advertiser.id)
        .outerjoin(LandingPage, AdObservation.landing_page_id == LandingPage.id)
        .join(SearchRun, AdObservation.search_run_id == SearchRun.id)
        .order_by(AdObservation.observed_at.desc())
        .limit(100)
    )
    if search_run_id is not None:
        consulta = consulta.where(AdObservation.search_run_id == search_run_id)

    resultado = await db.execute(consulta)

    observacoes = [
        {
            "id": observacao.id,
            "search_run_id": busca.id,
            "advertiser": anunciante.display_name or anunciante.domain,
            "domain": anunciante.domain,
            "title": observacao.title,
            "description": observacao.description,
            "position": observacao.position_index,
            "keyword": busca.keyword or busca.service_name,
            "location": busca.region_name,
            "device": busca.device,
            "target_url": observacao.target_url,
            "landing_page_url": pagina.canonical_url if pagina else None,
            "observed_at": observacao.observed_at,
        }
        for observacao, anunciante, pagina, busca in resultado.all()
    ]

    busca_atual = None
    if busca_selecionada is not None:
        busca_atual = {
            "id": busca_selecionada.id,
            "keyword": busca_selecionada.keyword or busca_selecionada.service_name,
            "location": busca_selecionada.region_name,
            "device": busca_selecionada.device,
            "status": busca_selecionada.status,
            "ads_found": busca_selecionada.ads_found,
            "requested_at": busca_selecionada.requested_at,
        }

    return {"search_run": busca_atual, "observations": observacoes}


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
