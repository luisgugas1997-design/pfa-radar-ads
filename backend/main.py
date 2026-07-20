import asyncio
import logging
import os
import secrets
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Annotated, Literal

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.responses import FileResponse
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import engine, get_db, initialize_database
from backend.models import Advertiser, SearchRun
from backend.services.dashboard_service import (
    construir_dashboard,
    listar_observacoes_com_snapshots,
)
from backend.services.competitor_service import (
    construir_mapa_termos_observados,
    listar_anunciantes_observados,
    listar_snapshots_landing_page,
    listar_variacoes_criativas_observadas,
    obter_perfil_anunciante_observado,
)
from backend.services.orchestrator import executar_varredura
from backend.services.search_planner import criar_plano_busca
from backend.services.serpapi_service import obter_cota_serpapi
from backend.services.transparency_service import (
    executar_transparency_scan,
    obter_transparency_do_anunciante,
    resumir_transparency_scan,
)


class ScanRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    keyword: str = Field(min_length=2, max_length=255)
    location: str = Field(min_length=2, max_length=160)
    device: Literal["mobile", "desktop"]
    service: str | None = Field(default=None, min_length=2, max_length=120)


class TransparencyScanRequest(BaseModel):
    """Confirma explicitamente a única consulta cobrada desta operação."""

    confirm_cost: Literal[True]
    num: int = Field(default=100, ge=1, le=100)


@asynccontextmanager
async def lifespan(_: FastAPI):
    await initialize_database()
    yield
    await engine.dispose()


app = FastAPI(title="Radar API", lifespan=lifespan)
logger = logging.getLogger("uvicorn.error")
security = HTTPBasic(auto_error=False)
scan_lock = asyncio.Lock()
transparency_lock = asyncio.Lock()
RADAR_FRONTEND_PATH = Path(__file__).resolve().parent.parent / "frontend" / "radar_mockup.html"
SCREENSHOTS_PATH = Path(__file__).resolve().parent.parent / "screenshots"
SCREENSHOTS_PATH.mkdir(parents=True, exist_ok=True)


async def verificar_acesso_radar(
    credentials: Annotated[HTTPBasicCredentials | None, Depends(security)],
) -> None:
    usuario_esperado = os.getenv("RADAR_ACCESS_USER")
    senha_esperada = os.getenv("RADAR_ACCESS_PASSWORD")
    if not usuario_esperado or not senha_esperada:
        raise HTTPException(
            status_code=503,
            detail="Acesso do Radar ainda não foi configurado.",
        )
    usuario_recebido = credentials.username if credentials else ""
    senha_recebida = credentials.password if credentials else ""
    if not (
        secrets.compare_digest(usuario_recebido, usuario_esperado)
        and secrets.compare_digest(senha_recebida, senha_esperada)
    ):
        raise HTTPException(
            status_code=401,
            detail="Credenciais inválidas.",
            headers={"WWW-Authenticate": 'Basic realm="Radar PFA"'},
        )


RADAR_PROTEGIDO = [Depends(verificar_acesso_radar)]


@app.get("/")
async def health_check() -> dict:
    return {"status": "Radar API Online"}


@app.get("/radar", include_in_schema=False, dependencies=RADAR_PROTEGIDO)
async def radar_frontend() -> FileResponse:
    return FileResponse(RADAR_FRONTEND_PATH)


@app.get(
    "/screenshots/{file_name}",
    include_in_schema=False,
    dependencies=RADAR_PROTEGIDO,
)
async def servir_screenshot(file_name: str) -> FileResponse:
    nome_seguro = Path(file_name).name
    if nome_seguro != file_name or Path(nome_seguro).suffix.lower() != ".png":
        raise HTTPException(status_code=404, detail="Captura não encontrada.")
    arquivo = SCREENSHOTS_PATH / nome_seguro
    if not arquivo.is_file():
        raise HTTPException(status_code=404, detail="Captura não encontrada.")
    return FileResponse(arquivo, media_type="image/png")


@app.get("/api/radar/observations", dependencies=RADAR_PROTEGIDO)
async def listar_observacoes(
    search_run_id: int | None = Query(default=None, ge=1),
    db: AsyncSession = Depends(get_db),
) -> dict:
    busca_selecionada = None
    if search_run_id is not None:
        busca_selecionada = await db.get(SearchRun, search_run_id)
        if busca_selecionada is None:
            raise HTTPException(status_code=404, detail="Pesquisa não encontrada.")

    observacoes = await listar_observacoes_com_snapshots(
        db,
        search_run_id=search_run_id,
        limit=100,
    )

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


@app.get("/api/radar/search-runs", dependencies=RADAR_PROTEGIDO)
async def listar_execucoes_busca(
    limit: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> dict:
    execucoes = (
        await db.scalars(
            select(SearchRun)
            .order_by(SearchRun.requested_at.desc())
            .limit(limit)
        )
    ).all()
    return {
        "runs": [
            {
                "id": execucao.id,
                "service": execucao.service_name,
                "keyword": execucao.keyword,
                "location": execucao.region_name,
                "device": execucao.device,
                "status": execucao.status,
                "ads_found": execucao.ads_found,
                "requested_at": execucao.requested_at,
                "completed_at": execucao.completed_at,
                "error": execucao.error_message,
            }
            for execucao in execucoes
        ]
    }


@app.get("/api/radar/advertisers", dependencies=RADAR_PROTEGIDO)
async def listar_anunciantes(
    days: int = Query(default=30, ge=1, le=365),
    page: int = Query(default=1, ge=1, le=100_000),
    page_size: int = Query(default=25, ge=1, le=100),
    service: str | None = Query(default=None, max_length=120),
    location: str | None = Query(default=None, max_length=500),
    device: Literal["mobile", "desktop"] | None = Query(default=None),
    search: str | None = Query(default=None, max_length=100),
    db: AsyncSession = Depends(get_db),
) -> dict:
    return await listar_anunciantes_observados(
        db,
        days=days,
        page=page,
        page_size=page_size,
        service=service,
        location=location,
        device=device,
        search=search,
    )


@app.get("/api/radar/advertisers/{advertiser_id}", dependencies=RADAR_PROTEGIDO)
async def obter_perfil_anunciante(
    advertiser_id: int,
    days: int = Query(default=30, ge=1, le=365),
    service: str | None = Query(default=None, max_length=120),
    location: str | None = Query(default=None, max_length=500),
    device: Literal["mobile", "desktop"] | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
) -> dict:
    if advertiser_id < 1:
        raise HTTPException(status_code=422, detail="ID de anunciante invÃ¡lido.")
    resultado = await obter_perfil_anunciante_observado(
        db,
        advertiser_id,
        days=days,
        service=service,
        location=location,
        device=device,
    )
    if resultado is None:
        raise HTTPException(
            status_code=404,
            detail="Anunciante observado nÃ£o encontrado.",
        )
    return resultado


@app.get("/api/radar/term-map", dependencies=RADAR_PROTEGIDO)
async def obter_mapa_termos(
    days: int = Query(default=30, ge=1, le=365),
    page: int = Query(default=1, ge=1, le=100_000),
    page_size: int = Query(default=50, ge=1, le=200),
    service: str | None = Query(default=None, max_length=120),
    location: str | None = Query(default=None, max_length=500),
    device: Literal["mobile", "desktop"] | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
) -> dict:
    return await construir_mapa_termos_observados(
        db,
        days=days,
        page=page,
        page_size=page_size,
        service=service,
        location=location,
        device=device,
    )


@app.get("/api/radar/creatives", dependencies=RADAR_PROTEGIDO)
async def listar_criativos(
    days: int = Query(default=30, ge=1, le=365),
    page: int = Query(default=1, ge=1, le=100_000),
    page_size: int = Query(default=25, ge=1, le=100),
    advertiser_id: int | None = Query(default=None, ge=1),
    service: str | None = Query(default=None, max_length=120),
    location: str | None = Query(default=None, max_length=500),
    device: Literal["mobile", "desktop"] | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
) -> dict:
    return await listar_variacoes_criativas_observadas(
        db,
        days=days,
        page=page,
        page_size=page_size,
        advertiser_id=advertiser_id,
        service=service,
        location=location,
        device=device,
    )


@app.get(
    "/api/radar/landing-pages/{landing_page_id}/snapshots",
    dependencies=RADAR_PROTEGIDO,
)
async def listar_historico_landing_page(
    landing_page_id: int,
    page: int = Query(default=1, ge=1, le=100_000),
    page_size: int = Query(default=25, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> dict:
    if landing_page_id < 1:
        raise HTTPException(status_code=422, detail="ID de landing page invÃ¡lido.")
    resultado = await listar_snapshots_landing_page(
        db,
        landing_page_id,
        page=page,
        page_size=page_size,
    )
    if resultado is None:
        raise HTTPException(
            status_code=404,
            detail="Landing page observada nÃ£o encontrada.",
        )
    return resultado


@app.get(
    "/api/radar/advertisers/{advertiser_id}/transparency",
    dependencies=RADAR_PROTEGIDO,
)
async def obter_transparencia_anunciante(
    advertiser_id: int,
    limit: int = Query(default=100, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> dict:
    anunciante = await db.get(Advertiser, advertiser_id)
    if anunciante is None:
        raise HTTPException(
            status_code=404,
            detail="Anunciante observado não encontrado.",
        )
    return await obter_transparency_do_anunciante(
        db,
        advertiser_id,
        limit=limit,
    )


@app.post(
    "/api/radar/advertisers/{advertiser_id}/transparency/scan",
    dependencies=RADAR_PROTEGIDO,
)
async def executar_scan_transparencia(
    advertiser_id: int,
    request: TransparencyScanRequest,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Executa uma página sob demanda; nunca pagina nem abre detalhes sozinho."""

    async with transparency_lock:
        anunciante = await db.get(Advertiser, advertiser_id)
        if anunciante is None:
            raise HTTPException(
                status_code=404,
                detail="Anunciante observado não encontrado.",
            )

        try:
            cota = await obter_cota_serpapi()
            restante = cota.get("remaining")
            if not isinstance(restante, int):
                raise HTTPException(
                    status_code=503,
                    detail="Não foi possível confirmar o saldo da SerpApi.",
                )
            if restante < 1:
                raise HTTPException(
                    status_code=429,
                    detail="Saldo da SerpApi esgotado. Nenhuma consulta foi executada.",
                )

            scan = await executar_transparency_scan(
                db,
                anunciante,
                num=request.num,
            )
            return {
                "status": "sucesso",
                "estimated_credits": 1,
                "scan": resumir_transparency_scan(scan),
                "notice": (
                    "Foi consultada somente a primeira página do Centro de "
                    "Transparência; nenhuma paginação ou detalhe individual foi executado."
                ),
            }
        except HTTPException:
            raise
        except Exception as erro:
            logger.exception("Falha na consulta manual do Centro de Transparência")
            raise HTTPException(
                status_code=500,
                detail=(
                    "A consulta ao Centro de Transparência falhou. "
                    "Nenhuma paginação adicional foi executada."
                ),
            ) from erro


@app.get("/api/radar/dashboard", dependencies=RADAR_PROTEGIDO)
async def obter_dashboard(
    days: int = Query(default=30),
    service: str | None = Query(default=None),
    location: str | None = Query(default=None),
    device: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
) -> dict:
    try:
        return await construir_dashboard(
            db,
            days=days,
            service=service,
            location=location,
            device=device,
        )
    except ValueError as erro:
        raise HTTPException(status_code=422, detail=str(erro)) from erro


@app.get("/api/radar/search-plan", dependencies=RADAR_PROTEGIDO)
async def obter_plano_busca(
    service: str = Query(min_length=1),
    locations: str = Query(min_length=1),
    devices: str = Query(default="mobile", min_length=1),
    mode: Literal["economico", "completo"] = Query(default="economico"),
) -> dict:
    try:
        return criar_plano_busca(
            service=service,
            locations=locations,
            devices=devices,
            mode=mode,
        )
    except ValueError as erro:
        raise HTTPException(status_code=422, detail=str(erro)) from erro


@app.get("/api/radar/quota", dependencies=RADAR_PROTEGIDO)
async def consultar_cota_serpapi() -> dict:
    try:
        return await obter_cota_serpapi()
    except Exception as erro:
        return {
            "status": "unavailable",
            "monthly_limit": None,
            "used": None,
            "remaining": None,
            "renewal": None,
            "error": str(erro),
        }


@app.post("/api/radar/scan", dependencies=RADAR_PROTEGIDO)
async def executar_scan(
    request: ScanRequest,
    db: AsyncSession = Depends(get_db),
) -> dict:
    async with scan_lock:
        try:
            cota = await obter_cota_serpapi()
            restante = cota.get("remaining")
            if not isinstance(restante, int):
                raise HTTPException(
                    status_code=503,
                    detail="Não foi possível confirmar o saldo da SerpApi.",
                )
            if restante < 1:
                raise HTTPException(
                    status_code=429,
                    detail="Saldo da SerpApi esgotado. Nenhuma busca foi executada.",
                )

            resultado = await executar_varredura(
                db,
                request.keyword,
                request.location,
                request.device,
                service_name=request.service,
            )
            return {
                "status": "sucesso",
                "search_run_id": resultado.id,
                "ads_found": resultado.ads_found,
            }
        except HTTPException:
            raise
        except Exception as erro:
            logger.exception("Falha ao executar varredura do Radar")
            raise HTTPException(
                status_code=500,
                detail="A varredura falhou. Consulte os logs do serviço.",
            ) from erro
