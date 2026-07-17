from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_db
from backend.services.orchestrator import executar_varredura


class ScanRequest(BaseModel):
    keyword: str
    location: str
    device: str


app = FastAPI(title="Radar API")

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
