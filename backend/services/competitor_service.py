from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import and_, case, distinct, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models import (
    AdObservation,
    Advertiser,
    LandingPage,
    LandingPageSnapshot,
    SearchRun,
)
from backend.services.dashboard_service import (
    _condicoes_busca,
    _inicio_janela,
)


BASE_CAVEATS = [
    (
        "Os resultados representam somente evidências públicas observadas nas "
        "consultas executadas pelo Radar."
    ),
    (
        "Ausência em uma consulta não comprova ausência de publicidade; localização, "
        "dispositivo, momento e leilão alteram o que é exibido."
    ),
    (
        "Consultas observadas são termos pesquisados pelo Radar e não revelam a "
        "configuração interna da conta do anunciante."
    ),
]


def _janela(days: int) -> tuple[datetime, datetime]:
    fim = datetime.now(timezone.utc)
    return _inicio_janela(days, fim), fim


def _paginacao(page: int, page_size: int, total: int) -> dict:
    return {
        "page": page,
        "page_size": page_size,
        "total_items": total,
        "total_pages": (total + page_size - 1) // page_size if total else 0,
    }


def _metadata(
    *,
    inicio: datetime | None,
    fim: datetime,
    freshness: datetime | None,
    last_search_at: datetime | None = None,
    pagination: dict | None = None,
    filters: dict | None = None,
) -> dict:
    resultado = {
        "scope": "observado",
        "generated_at": fim,
        "window_start": inicio,
        "window_end": fim,
        "freshness": {
            "last_observation_at": freshness,
            "last_search_at": last_search_at,
            "status": (
                "available"
                if freshness
                else "searched_without_observations"
                if last_search_at
                else "no_data"
            ),
        },
        "filters": filters or {},
        "measurement_types": {
            "observed": "Contagem direta de registros coletados pelo Radar.",
            "derived": "Agrupamento ou cálculo feito somente sobre registros observados.",
        },
    }
    if pagination is not None:
        resultado["pagination"] = pagination
    return resultado


def _methodology(entity: str) -> dict:
    return {
        "entity": entity,
        "observation": (
            "Uma observação é um anúncio retornado para uma combinação de consulta, "
            "localização, dispositivo e momento."
        ),
        "unique_variation": (
            "Uma variação única observada usa o fingerprint persistido de título, "
            "descrição e URL de destino."
        ),
        "presence": (
            "Presença observada é a proporção de buscas concluídas em que houve "
            "registro; não é participação de mercado."
        ),
    }


def _filtros_busca(
    inicio: datetime,
    fim: datetime,
    service: str | None,
    location: str | None,
    device: str | None,
) -> list:
    return _condicoes_busca(inicio, fim, service, location, device)


async def listar_anunciantes_observados(
    session: AsyncSession,
    *,
    days: int,
    page: int,
    page_size: int,
    service: str | None = None,
    location: str | None = None,
    device: str | None = None,
    search: str | None = None,
) -> dict:
    inicio, fim = _janela(days)
    filtros = _filtros_busca(inicio, fim, service, location, device)
    filtros.append(SearchRun.status == "completed")
    if search:
        termo = f"%{search.strip()}%"
        filtros.append(
            or_(
                Advertiser.domain.ilike(termo),
                Advertiser.display_name.ilike(termo),
            )
        )

    observacoes = func.count(AdObservation.id)
    variacoes = func.count(distinct(AdObservation.fingerprint))
    buscas_com_presenca = func.count(distinct(SearchRun.id))
    consulta = func.coalesce(SearchRun.keyword, SearchRun.service_name)
    agrupada = (
        select(
            Advertiser.id.label("advertiser_id"),
            Advertiser.display_name.label("advertiser"),
            Advertiser.domain,
            observacoes.label("observations"),
            variacoes.label("unique_ads_observed"),
            buscas_com_presenca.label("search_runs_with_presence"),
            func.count(distinct(consulta)).label("queries_observed"),
            func.count(distinct(SearchRun.region_name)).label("regions_observed"),
            func.count(distinct(AdObservation.landing_page_id)).label(
                "landing_pages_observed"
            ),
            func.min(AdObservation.observed_at).label("first_observed_at"),
            func.max(AdObservation.observed_at).label("last_observed_at"),
        )
        .select_from(Advertiser)
        .join(AdObservation, AdObservation.advertiser_id == Advertiser.id)
        .join(SearchRun, SearchRun.id == AdObservation.search_run_id)
        .where(*filtros)
        .group_by(Advertiser.id, Advertiser.display_name, Advertiser.domain)
    )
    total = int(
        await session.scalar(
            select(func.count()).select_from(agrupada.order_by(None).subquery())
        )
        or 0
    )
    linhas = (
        await session.execute(
            agrupada.order_by(observacoes.desc(), variacoes.desc(), Advertiser.domain)
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
    ).mappings().all()
    total_buscas = int(
        await session.scalar(
            select(func.count(distinct(SearchRun.id))).where(
                *_filtros_busca(inicio, fim, service, location, device),
                SearchRun.status == "completed",
            )
        )
        or 0
    )
    freshness = await session.scalar(
        select(func.max(AdObservation.observed_at))
        .join(SearchRun, SearchRun.id == AdObservation.search_run_id)
        .join(Advertiser, Advertiser.id == AdObservation.advertiser_id)
        .where(*filtros)
    )

    itens = []
    for linha in linhas:
        presencas = int(linha["search_runs_with_presence"] or 0)
        itens.append(
            {
                **dict(linha),
                "advertiser": linha["advertiser"] or linha["domain"],
                "observed_presence_rate": (
                    round(100 * presencas / total_buscas, 1) if total_buscas else 0.0
                ),
                "measurement": "observado_e_derivado",
            }
        )

    filtros_resposta = {
        "days": days,
        "service": service,
        "location": location,
        "device": device,
        "search": search,
    }
    return {
        "advertisers": itens,
        "advertisers_observed": itens,
        "metadata": _metadata(
            inicio=inicio,
            fim=fim,
            freshness=freshness,
            pagination=_paginacao(page, page_size, total),
            filters=filtros_resposta,
        ),
        "methodology": _methodology("advertisers_observed"),
        "caveats": BASE_CAVEATS,
    }


async def obter_perfil_anunciante_observado(
    session: AsyncSession,
    advertiser_id: int,
    *,
    days: int,
    service: str | None = None,
    location: str | None = None,
    device: str | None = None,
) -> dict | None:
    anunciante = await session.get(Advertiser, advertiser_id)
    if anunciante is None:
        return None

    inicio, fim = _janela(days)
    filtros = [
        *_filtros_busca(inicio, fim, service, location, device),
        SearchRun.status == "completed",
        AdObservation.advertiser_id == advertiser_id,
    ]
    resumo = (
        await session.execute(
            select(
                func.count(AdObservation.id).label("observations"),
                func.count(distinct(AdObservation.fingerprint)).label(
                    "unique_ads_observed"
                ),
                func.count(distinct(SearchRun.id)).label(
                    "search_runs_with_presence"
                ),
                func.count(
                    distinct(func.coalesce(SearchRun.keyword, SearchRun.service_name))
                ).label("queries_observed"),
                func.count(distinct(SearchRun.region_name)).label(
                    "regions_observed"
                ),
                func.count(distinct(AdObservation.landing_page_id)).label(
                    "landing_pages_observed"
                ),
                func.min(AdObservation.observed_at).label("first_observed_at"),
                func.max(AdObservation.observed_at).label("last_observed_at"),
            )
            .select_from(AdObservation)
            .join(SearchRun, SearchRun.id == AdObservation.search_run_id)
            .where(*filtros)
        )
    ).mappings().one()

    total_buscas = int(
        await session.scalar(
            select(func.count(distinct(SearchRun.id))).where(
                *_filtros_busca(inicio, fim, service, location, device),
                SearchRun.status == "completed",
            )
        )
        or 0
    )
    query_expression = func.coalesce(SearchRun.keyword, SearchRun.service_name)
    termos = (
        await session.execute(
            select(
                query_expression.label("query_observed"),
                func.count(AdObservation.id).label("observations"),
                func.count(distinct(AdObservation.fingerprint)).label(
                    "unique_ads_observed"
                ),
                func.count(distinct(SearchRun.id)).label("search_runs_with_presence"),
                func.array_agg(distinct(SearchRun.region_name)).label(
                    "locations_observed"
                ),
                func.array_agg(distinct(SearchRun.device)).label(
                    "devices_observed"
                ),
                func.max(AdObservation.observed_at).label("last_observed_at"),
            )
            .select_from(AdObservation)
            .join(SearchRun, SearchRun.id == AdObservation.search_run_id)
            .where(*filtros)
            .group_by(query_expression)
            .order_by(func.count(AdObservation.id).desc(), query_expression)
            .limit(50)
        )
    ).mappings().all()
    landings = (
        await session.execute(
            select(
                LandingPage.id.label("landing_page_id"),
                LandingPage.canonical_url,
                LandingPage.domain,
                func.count(AdObservation.id).label("observations"),
                func.count(distinct(AdObservation.fingerprint)).label(
                    "unique_ads_observed"
                ),
                func.min(AdObservation.observed_at).label("first_observed_at"),
                func.max(AdObservation.observed_at).label("last_observed_at"),
            )
            .select_from(AdObservation)
            .join(SearchRun, SearchRun.id == AdObservation.search_run_id)
            .join(LandingPage, LandingPage.id == AdObservation.landing_page_id)
            .where(*filtros)
            .group_by(LandingPage.id, LandingPage.canonical_url, LandingPage.domain)
            .order_by(func.count(AdObservation.id).desc())
            .limit(50)
        )
    ).mappings().all()

    landing_items = [dict(item) for item in landings]
    landing_ids = [item["landing_page_id"] for item in landing_items]
    if landing_ids:
        snapshot_counts = dict(
            (
                await session.execute(
                    select(
                        LandingPageSnapshot.landing_page_id,
                        func.count(LandingPageSnapshot.id),
                    )
                    .where(LandingPageSnapshot.landing_page_id.in_(landing_ids))
                    .group_by(LandingPageSnapshot.landing_page_id)
                )
            ).all()
        )
        latest_snapshots = (
            await session.scalars(
                select(LandingPageSnapshot)
                .where(LandingPageSnapshot.landing_page_id.in_(landing_ids))
                .distinct(LandingPageSnapshot.landing_page_id)
                .order_by(
                    LandingPageSnapshot.landing_page_id,
                    LandingPageSnapshot.captured_at.desc(),
                    LandingPageSnapshot.id.desc(),
                )
            )
        ).all()
        latest_by_landing = {
            snapshot.landing_page_id: snapshot for snapshot in latest_snapshots
        }
    else:
        snapshot_counts = {}
        latest_by_landing = {}

    for item in landing_items:
        latest = latest_by_landing.get(item["landing_page_id"])
        screenshot_url = None
        if latest is not None and latest.screenshot_path:
            screenshot_url = f"/screenshots/{Path(latest.screenshot_path).name}"
        item["snapshot_count"] = int(
            snapshot_counts.get(item["landing_page_id"], 0)
        )
        item["latest_snapshot"] = (
            {
                "snapshot_id": latest.id,
                "capture_status": latest.capture_status,
                "screenshot_url": screenshot_url,
                "h1": latest.h1,
                "primary_cta": latest.primary_cta,
                "whatsapp_url": latest.whatsapp_url,
                "whatsapp_links": latest.whatsapp_links or [],
                "captured_at": latest.captured_at,
            }
            if latest is not None
            else None
        )

    criativos = (
        await session.execute(
            select(
                AdObservation.fingerprint.label("variation_fingerprint"),
                AdObservation.title,
                AdObservation.description,
                AdObservation.target_url,
                func.count(AdObservation.id).label("observations"),
                func.array_agg(distinct(query_expression)).label(
                    "queries_observed"
                ),
                func.array_agg(distinct(SearchRun.region_name)).label(
                    "locations_observed"
                ),
                func.array_agg(distinct(SearchRun.device)).label(
                    "devices_observed"
                ),
                func.min(AdObservation.observed_at).label("first_observed_at"),
                func.max(AdObservation.observed_at).label("last_observed_at"),
            )
            .select_from(AdObservation)
            .join(SearchRun, SearchRun.id == AdObservation.search_run_id)
            .where(*filtros)
            .group_by(
                AdObservation.fingerprint,
                AdObservation.title,
                AdObservation.description,
                AdObservation.target_url,
            )
            .order_by(func.max(AdObservation.observed_at).desc())
            .limit(50)
        )
    ).mappings().all()

    timeline = (
        await session.execute(
            select(
                func.date_trunc("day", AdObservation.observed_at).label(
                    "observed_day"
                ),
                func.count(AdObservation.id).label("observations"),
                func.count(distinct(AdObservation.fingerprint)).label(
                    "unique_ads_observed"
                ),
                func.count(distinct(SearchRun.id)).label("search_runs_with_presence"),
            )
            .select_from(AdObservation)
            .join(SearchRun, SearchRun.id == AdObservation.search_run_id)
            .where(*filtros)
            .group_by(func.date_trunc("day", AdObservation.observed_at))
            .order_by(func.date_trunc("day", AdObservation.observed_at))
            .limit(366)
        )
    ).mappings().all()

    resumo_dict = dict(resumo)
    presencas = int(resumo_dict["search_runs_with_presence"] or 0)
    resumo_dict["observed_presence_rate"] = (
        round(100 * presencas / total_buscas, 1) if total_buscas else 0.0
    )
    filtros_resposta = {
        "days": days,
        "service": service,
        "location": location,
        "device": device,
    }
    advertiser_profile = {
        "advertiser_id": anunciante.id,
        "advertiser": anunciante.display_name or anunciante.domain,
        "domain": anunciante.domain,
        "first_seen_at": anunciante.first_seen_at,
        **resumo_dict,
    }
    query_items = [dict(item) for item in termos]
    creative_items = [dict(item) for item in criativos]
    timeline_items = [dict(item) for item in timeline]
    return {
        "advertiser": advertiser_profile,
        "advertiser_observed_profile": advertiser_profile,
        "queries": query_items,
        "top_queries_observed": query_items,
        "landing_pages": landing_items,
        "landing_pages_observed": landing_items,
        "creatives": creative_items,
        "recent_creative_variations_observed": creative_items,
        "timeline": timeline_items,
        "timeline_observed": timeline_items,
        "metadata": _metadata(
            inicio=inicio,
            fim=fim,
            freshness=resumo_dict["last_observed_at"],
            filters=filtros_resposta,
        ),
        "methodology": _methodology("advertiser_observed_profile"),
        "caveats": BASE_CAVEATS,
    }


async def construir_mapa_termos_observados(
    session: AsyncSession,
    *,
    days: int,
    page: int,
    page_size: int,
    service: str | None = None,
    location: str | None = None,
    device: str | None = None,
) -> dict:
    inicio, fim = _janela(days)
    filtros = _filtros_busca(inicio, fim, service, location, device)
    query_expression = func.coalesce(SearchRun.keyword, SearchRun.service_name)
    completed_runs = func.count(
        distinct(case((SearchRun.status == "completed", SearchRun.id)))
    )
    failed_runs = func.count(
        distinct(case((SearchRun.status == "failed", SearchRun.id)))
    )
    runs_with_observations = func.count(
        distinct(
            case(
                (
                    and_(
                        SearchRun.status == "completed",
                        AdObservation.id.is_not(None),
                    ),
                    SearchRun.id,
                )
            )
        )
    )
    grouped = (
        select(
            query_expression.label("query_searched"),
            SearchRun.region_name.label("location"),
            SearchRun.device,
            func.count(distinct(SearchRun.id)).label("search_runs"),
            completed_runs.label("completed_runs"),
            failed_runs.label("failed_runs"),
            runs_with_observations.label("runs_with_observations"),
            func.count(AdObservation.id).label("observations"),
            func.count(distinct(AdObservation.fingerprint)).label(
                "unique_ads_observed"
            ),
            func.count(distinct(AdObservation.advertiser_id)).label(
                "advertisers_observed"
            ),
            func.max(SearchRun.requested_at).label("last_searched_at"),
            func.max(AdObservation.observed_at).label("last_observed_at"),
        )
        .select_from(SearchRun)
        .outerjoin(AdObservation, AdObservation.search_run_id == SearchRun.id)
        .where(*filtros)
        .group_by(query_expression, SearchRun.region_name, SearchRun.device)
    )
    total = int(
        await session.scalar(
            select(func.count()).select_from(grouped.order_by(None).subquery())
        )
        or 0
    )
    linhas = (
        await session.execute(
            grouped.order_by(
                func.count(AdObservation.id).desc(),
                query_expression,
                SearchRun.region_name,
                SearchRun.device,
            )
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
    ).mappings().all()
    last_search_at = await session.scalar(
        select(func.max(SearchRun.requested_at)).where(*filtros)
    )
    freshness = await session.scalar(
        select(func.max(AdObservation.observed_at))
        .select_from(SearchRun)
        .outerjoin(AdObservation, AdObservation.search_run_id == SearchRun.id)
        .where(*filtros)
    )
    itens = []
    for linha in linhas:
        item = dict(linha)
        concluidas = int(item["completed_runs"] or 0)
        com_presenca = int(item["runs_with_observations"] or 0)
        item["observed_presence_rate"] = (
            round(100 * com_presenca / concluidas, 1) if concluidas else 0.0
        )
        item["measurement"] = "observado_e_derivado"
        itens.append(item)

    filtros_resposta = {
        "days": days,
        "service": service,
        "location": location,
        "device": device,
    }
    metodologia = _methodology("term_map_observed")
    metodologia["zero_result"] = (
        "Células com zero observações continuam no mapa quando a consulta foi "
        "executada, preservando o denominador da cobertura."
    )
    return {
        "term_map": itens,
        "term_map_observed": itens,
        "metadata": _metadata(
            inicio=inicio,
            fim=fim,
            freshness=freshness,
            last_search_at=last_search_at,
            pagination=_paginacao(page, page_size, total),
            filters=filtros_resposta,
        ),
        "methodology": metodologia,
        "caveats": BASE_CAVEATS,
    }


async def listar_variacoes_criativas_observadas(
    session: AsyncSession,
    *,
    days: int,
    page: int,
    page_size: int,
    advertiser_id: int | None = None,
    service: str | None = None,
    location: str | None = None,
    device: str | None = None,
) -> dict:
    inicio, fim = _janela(days)
    filtros = _filtros_busca(inicio, fim, service, location, device)
    filtros.append(SearchRun.status == "completed")
    if advertiser_id is not None:
        filtros.append(AdObservation.advertiser_id == advertiser_id)
    query_expression = func.coalesce(SearchRun.keyword, SearchRun.service_name)
    observations = func.count(AdObservation.id)
    grouped = (
        select(
            AdObservation.fingerprint.label("variation_fingerprint"),
            Advertiser.id.label("advertiser_id"),
            Advertiser.display_name.label("advertiser"),
            Advertiser.domain,
            AdObservation.landing_page_id,
            AdObservation.title,
            AdObservation.description,
            AdObservation.displayed_url,
            AdObservation.target_url,
            observations.label("observations"),
            func.count(distinct(SearchRun.id)).label("search_runs_observed"),
            func.count(distinct(query_expression)).label("query_count"),
            func.count(distinct(SearchRun.region_name)).label("location_count"),
            func.count(distinct(SearchRun.device)).label("device_count"),
            func.array_agg(distinct(query_expression)).label(
                "queries_observed"
            ),
            func.array_agg(distinct(SearchRun.region_name)).label(
                "locations_observed"
            ),
            func.array_agg(distinct(SearchRun.device)).label(
                "devices_observed"
            ),
            func.min(AdObservation.observed_at).label("first_observed_at"),
            func.max(AdObservation.observed_at).label("last_observed_at"),
        )
        .select_from(AdObservation)
        .join(Advertiser, Advertiser.id == AdObservation.advertiser_id)
        .join(SearchRun, SearchRun.id == AdObservation.search_run_id)
        .where(*filtros)
        .group_by(
            AdObservation.fingerprint,
            Advertiser.id,
            Advertiser.display_name,
            Advertiser.domain,
            AdObservation.landing_page_id,
            AdObservation.title,
            AdObservation.description,
            AdObservation.displayed_url,
            AdObservation.target_url,
        )
    )
    total = int(
        await session.scalar(
            select(func.count()).select_from(grouped.order_by(None).subquery())
        )
        or 0
    )
    linhas = (
        await session.execute(
            grouped.order_by(
                func.max(AdObservation.observed_at).desc(), observations.desc()
            )
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
    ).mappings().all()
    freshness = await session.scalar(
        select(func.max(AdObservation.observed_at))
        .join(SearchRun, SearchRun.id == AdObservation.search_run_id)
        .where(*filtros)
    )
    itens = []
    for linha in linhas:
        item = dict(linha)
        item["advertiser"] = item["advertiser"] or item["domain"]
        item["measurement"] = "variação_derivada_de_observações"
        itens.append(item)
    filtros_resposta = {
        "days": days,
        "advertiser_id": advertiser_id,
        "service": service,
        "location": location,
        "device": device,
    }
    metodologia = _methodology("creative_variations_observed")
    metodologia["inventory"] = (
        "O inventário contém somente variações que apareceram nas buscas do Radar "
        "durante a janela selecionada."
    )
    return {
        "creatives": itens,
        "creative_variations_observed": itens,
        "metadata": _metadata(
            inicio=inicio,
            fim=fim,
            freshness=freshness,
            pagination=_paginacao(page, page_size, total),
            filters=filtros_resposta,
        ),
        "methodology": metodologia,
        "caveats": BASE_CAVEATS,
    }


def _snapshot_changed(
    current: LandingPageSnapshot,
    previous: LandingPageSnapshot | None,
) -> bool | None:
    if previous is None:
        return None
    comparisons = []
    if current.content_hash and previous.content_hash:
        comparisons.append(current.content_hash != previous.content_hash)
    if current.dom_hash and previous.dom_hash:
        comparisons.append(current.dom_hash != previous.dom_hash)
    return any(comparisons) if comparisons else None


def _snapshot_item(
    snapshot: LandingPageSnapshot,
    previous: LandingPageSnapshot | None,
) -> dict:
    screenshot_url = None
    if snapshot.screenshot_path:
        screenshot_url = f"/screenshots/{Path(snapshot.screenshot_path).name}"
    return {
        "snapshot_id": snapshot.id,
        "ad_observation_id": snapshot.ad_observation_id,
        "capture_status": snapshot.capture_status,
        "original_url": snapshot.original_url,
        "final_url": snapshot.final_url,
        "http_status": snapshot.http_status,
        "page_title": snapshot.page_title,
        "meta_description": snapshot.meta_description,
        "canonical_url": snapshot.canonical_url,
        "h1": snapshot.h1,
        "h2": snapshot.h2 or [],
        "headline": snapshot.headline,
        "subtitle": snapshot.subtitle,
        "primary_cta": snapshot.primary_cta,
        "whatsapp_url": snapshot.whatsapp_url,
        "whatsapp_links": snapshot.whatsapp_links or [],
        "form_fields": snapshot.form_fields or [],
        "faq_entries": snapshot.faq_entries or [],
        "social_proof": snapshot.social_proof or [],
        "urgency_signals": snapshot.urgency_signals or [],
        "authority_signals": snapshot.authority_signals or [],
        "screenshot_url": screenshot_url,
        "content_hash": snapshot.content_hash,
        "dom_hash": snapshot.dom_hash,
        "changed_from_previous_capture": _snapshot_changed(snapshot, previous),
        "captured_at": snapshot.captured_at,
        "error_message": snapshot.error_message,
        "measurement": "observado",
    }


async def listar_snapshots_landing_page(
    session: AsyncSession,
    landing_page_id: int,
    *,
    page: int,
    page_size: int,
) -> dict | None:
    landing_page = await session.get(LandingPage, landing_page_id)
    if landing_page is None:
        return None

    total = int(
        await session.scalar(
            select(func.count(LandingPageSnapshot.id)).where(
                LandingPageSnapshot.landing_page_id == landing_page_id
            )
        )
        or 0
    )
    snapshots = list(
        (
            await session.scalars(
                select(LandingPageSnapshot)
                .where(LandingPageSnapshot.landing_page_id == landing_page_id)
                .order_by(
                    LandingPageSnapshot.captured_at.desc(),
                    LandingPageSnapshot.id.desc(),
                )
                .offset((page - 1) * page_size)
                .limit(page_size + 1)
            )
        ).all()
    )
    current_page = snapshots[:page_size]
    items = [
        _snapshot_item(
            snapshot,
            snapshots[index + 1] if index + 1 < len(snapshots) else None,
        )
        for index, snapshot in enumerate(current_page)
    ]
    freshness = await session.scalar(
        select(func.max(LandingPageSnapshot.captured_at)).where(
            LandingPageSnapshot.landing_page_id == landing_page_id
        )
    )
    now = datetime.now(timezone.utc)
    metodologia = _methodology("landing_page_snapshots_observed")
    metodologia["change_detection"] = (
        "Mudança derivada compara os hashes disponíveis com a captura imediatamente "
        "anterior; valor nulo significa comparação insuficiente."
    )
    return {
        "landing_page": {
            "landing_page_id": landing_page.id,
            "canonical_url": landing_page.canonical_url,
            "domain": landing_page.domain,
            "first_seen_at": landing_page.first_seen_at,
        },
        "snapshots": items,
        "snapshots_observed": items,
        "metadata": _metadata(
            inicio=None,
            fim=now,
            freshness=freshness,
            pagination=_paginacao(page, page_size, total),
            filters={"landing_page_id": landing_page_id},
        ),
        "methodology": metodologia,
        "caveats": [
            *BASE_CAVEATS,
            (
                "Snapshots existem somente quando uma landing page vinculada a um "
                "anúncio observado foi capturada pelo scraper."
            ),
        ],
    }
