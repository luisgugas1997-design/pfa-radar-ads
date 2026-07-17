import re
import unicodedata
from collections import defaultdict
from datetime import datetime, time, timedelta, timezone
from pathlib import Path
from typing import Any
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models import (
    AdObservation,
    Advertiser,
    LandingPage,
    LandingPageSnapshot,
    SearchRun,
)
from backend.services.search_planner import SEARCH_PACKS, SERVICE_ALIASES


LEGACY_SERVICE_LABELS = {
    "direito de transito": ("Direito de Trânsito",),
    "lei seca": ("Recusa ao bafômetro", "Recusa bafômetro"),
    "suspensao": ("Suspensão da CNH", "Suspensao da CNH"),
    "cassacao": ("Cassação da CNH", "Cassacao da CNH"),
    "ppd": ("Permissão para Dirigir", "Permissão para Dirigir (PPD)"),
}


def _normalizar_texto(valor: object) -> str:
    texto = unicodedata.normalize("NFKC", str(valor or "")).casefold()
    return re.sub(r"\s+", " ", texto).strip()


def _chave_sem_acentos(valor: object) -> str:
    texto = unicodedata.normalize("NFKD", str(valor or "").strip().casefold())
    return re.sub(
        r"\s+",
        " ",
        texto.encode("ascii", "ignore").decode("ascii"),
    )


def _nomes_historicos_do_servico(service: str) -> list[str]:
    chave_recebida = _chave_sem_acentos(service)
    chave_pack = SERVICE_ALIASES.get(chave_recebida, chave_recebida)
    pack = SEARCH_PACKS.get(chave_pack)
    if pack is None:
        return [service.strip().lower()]
    nomes = {
        service.strip(),
        pack["label"],
        *pack["economico"],
        *pack["completo"],
        *(
            alias
            for alias, destino in SERVICE_ALIASES.items()
            if destino == chave_pack
        ),
        *LEGACY_SERVICE_LABELS.get(chave_pack, ()),
    }
    return sorted({nome.strip().lower() for nome in nomes if nome.strip()})


def _normalizar_url_anuncio(valor: object) -> str:
    texto = str(valor or "").strip()
    try:
        url = urlsplit(texto)
    except ValueError:
        return _normalizar_texto(texto)
    parametros_rastreamento = {
        "gclid",
        "gbraid",
        "wbraid",
        "fbclid",
        "gad_source",
        "gad_campaignid",
    }
    consulta = [
        (chave, valor_parametro)
        for chave, valor_parametro in parse_qsl(url.query, keep_blank_values=True)
        if not chave.casefold().startswith("utm_")
        and chave.casefold() not in parametros_rastreamento
    ]
    caminho = url.path.rstrip("/") or "/"
    return urlunsplit(
        (
            url.scheme.casefold(),
            url.netloc.casefold(),
            caminho,
            urlencode(consulta, doseq=True),
            "",
        )
    )


def _assinatura_anuncio(observacao: AdObservation) -> str:
    return "\x1f".join(
        (
            _normalizar_texto(observacao.title),
            _normalizar_texto(observacao.description),
            _normalizar_url_anuncio(observacao.target_url),
        )
    )


def _consulta_da_busca(busca: SearchRun) -> str:
    return (busca.keyword or busca.service_name).strip()


def _inicio_janela(days: int, agora: datetime) -> datetime:
    data_inicial = agora.date() - timedelta(days=days - 1)
    return datetime.combine(data_inicial, time.min, tzinfo=timezone.utc)


def _condicoes_busca(
    inicio: datetime,
    fim: datetime,
    service: str | None,
    location: str | None,
    device: str | None,
) -> list[Any]:
    condicoes: list[Any] = [
        SearchRun.requested_at >= inicio,
        SearchRun.requested_at <= fim,
    ]
    if service:
        condicoes.append(
            func.lower(func.trim(SearchRun.service_name)).in_(
                _nomes_historicos_do_servico(service)
            )
        )
    if location:
        locais = [
            item.strip().lower()
            for item in location.split(",")
            if item.strip()
        ]
        if locais:
            condicoes.append(
                func.lower(func.trim(SearchRun.region_name)).in_(locais)
            )
    if device:
        condicoes.append(func.lower(SearchRun.device) == device.strip().lower())
    return condicoes


async def _ultimos_snapshots(
    session: AsyncSession,
    landing_page_ids: set[int],
) -> dict[int, LandingPageSnapshot]:
    if not landing_page_ids:
        return {}

    resultado = await session.execute(
        select(LandingPageSnapshot)
        .where(LandingPageSnapshot.landing_page_id.in_(landing_page_ids))
        .order_by(
            LandingPageSnapshot.landing_page_id,
            LandingPageSnapshot.captured_at.desc(),
            LandingPageSnapshot.id.desc(),
        )
    )
    snapshots: dict[int, LandingPageSnapshot] = {}
    for snapshot in resultado.scalars():
        snapshots.setdefault(snapshot.landing_page_id, snapshot)
    return snapshots


def _snapshot_json(snapshot: LandingPageSnapshot | None) -> dict | None:
    if snapshot is None:
        return None
    screenshot_url = None
    if snapshot.screenshot_path:
        screenshot_url = f"/screenshots/{Path(snapshot.screenshot_path).name}"
    return {
        "id": snapshot.id,
        "status": snapshot.capture_status,
        "final_url": snapshot.final_url,
        "page_title": snapshot.page_title,
        "meta_description": snapshot.meta_description,
        "h1": snapshot.h1,
        "h2": snapshot.h2 or [],
        "primary_cta": snapshot.primary_cta,
        "whatsapp_url": snapshot.whatsapp_url,
        "whatsapp_links": snapshot.whatsapp_links or [],
        "form_fields": snapshot.form_fields or [],
        "faq_entries": snapshot.faq_entries or [],
        "social_proof": snapshot.social_proof or [],
        "urgency_signals": snapshot.urgency_signals or [],
        "authority_signals": snapshot.authority_signals or [],
        "screenshot_url": screenshot_url,
        "captured_at": snapshot.captured_at,
    }


def _observacao_json(
    linha: tuple[AdObservation, Advertiser, LandingPage | None, SearchRun],
    snapshot: LandingPageSnapshot | None,
) -> dict:
    observacao, anunciante, pagina, busca = linha
    return {
        "id": observacao.id,
        "search_run_id": busca.id,
        "advertiser": anunciante.display_name or anunciante.domain,
        "domain": anunciante.domain,
        "title": observacao.title,
        "description": observacao.description,
        "position": observacao.position_index,
        "position_block": observacao.position_block,
        "keyword": _consulta_da_busca(busca),
        "service": busca.service_name,
        "location": busca.region_name,
        "device": busca.device,
        "target_url": observacao.target_url,
        "landing_page_url": pagina.canonical_url if pagina else None,
        "phone": observacao.phone,
        "sitelinks": observacao.sitelinks or [],
        "observed_at": observacao.observed_at,
        "latest_snapshot": _snapshot_json(snapshot),
    }


async def listar_observacoes_com_snapshots(
    session: AsyncSession,
    search_run_id: int | None = None,
    limit: int = 100,
) -> list[dict]:
    consulta = (
        select(AdObservation, Advertiser, LandingPage, SearchRun)
        .join(Advertiser, AdObservation.advertiser_id == Advertiser.id)
        .outerjoin(LandingPage, AdObservation.landing_page_id == LandingPage.id)
        .join(SearchRun, AdObservation.search_run_id == SearchRun.id)
        .order_by(AdObservation.observed_at.desc(), AdObservation.id.desc())
        .limit(limit)
    )
    if search_run_id is not None:
        consulta = consulta.where(AdObservation.search_run_id == search_run_id)

    linhas = list((await session.execute(consulta)).all())
    landing_page_ids = {
        pagina.id for _, _, pagina, _ in linhas if pagina is not None
    }
    snapshots = await _ultimos_snapshots(session, landing_page_ids)
    return [
        _observacao_json(
            linha,
            snapshots.get(linha[2].id) if linha[2] is not None else None,
        )
        for linha in linhas
    ]


async def _opcoes_filtro(session: AsyncSession) -> dict:
    resultado = await session.execute(
        select(SearchRun.service_name, SearchRun.region_name, SearchRun.device)
    )
    servicos: set[str] = set()
    locais: set[str] = set()
    dispositivos: set[str] = set()
    for servico, local, dispositivo in resultado.all():
        if servico:
            servicos.add(servico)
        if local:
            locais.add(local)
        if dispositivo:
            dispositivos.add(dispositivo)
    return {
        "days": [7, 30, 90],
        "services": sorted(servicos, key=str.casefold),
        "locations": sorted(locais, key=str.casefold),
        "devices": sorted(dispositivos, key=str.casefold),
    }


async def construir_dashboard(
    session: AsyncSession,
    days: int,
    service: str | None = None,
    location: str | None = None,
    device: str | None = None,
) -> dict:
    if days not in {7, 30, 90}:
        raise ValueError("days deve ser 7, 30 ou 90.")
    if device and device.lower() not in {"mobile", "desktop"}:
        raise ValueError("device deve ser mobile ou desktop.")

    agora = datetime.now(timezone.utc)
    inicio = _inicio_janela(days, agora)
    condicoes = _condicoes_busca(
        inicio, agora, service, location, device
    )

    buscas = list(
        (
            await session.execute(
                select(SearchRun)
                .where(*condicoes)
                .order_by(SearchRun.requested_at.desc())
            )
        ).scalars()
    )
    resultado_observacoes = await session.execute(
        select(AdObservation, Advertiser, LandingPage, SearchRun)
        .join(Advertiser, AdObservation.advertiser_id == Advertiser.id)
        .outerjoin(LandingPage, AdObservation.landing_page_id == LandingPage.id)
        .join(SearchRun, AdObservation.search_run_id == SearchRun.id)
        .where(
            *condicoes,
            AdObservation.observed_at >= inicio,
            AdObservation.observed_at <= agora,
        )
        .order_by(AdObservation.observed_at.desc(), AdObservation.id.desc())
    )
    linhas = list(resultado_observacoes.all())

    ids_buscas_concluidas = {busca.id for busca in buscas if busca.status == "completed"}
    assinaturas = {_assinatura_anuncio(linha[0]) for linha in linhas}
    anunciantes = {linha[1].id for linha in linhas}
    paginas = {linha[2].id for linha in linhas if linha[2] is not None}
    ids_buscas_observadas = {linha[3].id for linha in linhas}
    consultas = {_normalizar_texto(_consulta_da_busca(busca)) for busca in buscas}
    consultas_concluidas = {
        _normalizar_texto(_consulta_da_busca(busca))
        for busca in buscas
        if busca.status == "completed"
    }
    locais = {busca.region_name for busca in buscas}
    dispositivos = {busca.device for busca in buscas}

    ranking_anunciantes: dict[int, dict[str, Any]] = defaultdict(dict)
    for observacao, anunciante, pagina, busca in linhas:
        item = ranking_anunciantes[anunciante.id]
        if not item:
            item.update(
                {
                    "advertiser_id": anunciante.id,
                    "advertiser": anunciante.display_name or anunciante.domain,
                    "domain": anunciante.domain,
                    "observations": 0,
                    "unique_ads": set(),
                    "search_runs": set(),
                    "landing_pages": set(),
                    "queries": set(),
                    "locations": set(),
                    "devices": set(),
                    "first_observed_at": observacao.observed_at,
                    "last_observed_at": observacao.observed_at,
                }
            )
        item["observations"] += 1
        item["unique_ads"].add(_assinatura_anuncio(observacao))
        item["search_runs"].add(busca.id)
        item["queries"].add(_consulta_da_busca(busca))
        item["locations"].add(busca.region_name)
        item["devices"].add(busca.device)
        if pagina is not None:
            item["landing_pages"].add(pagina.id)
        item["first_observed_at"] = min(
            item["first_observed_at"], observacao.observed_at
        )
        item["last_observed_at"] = max(
            item["last_observed_at"], observacao.observed_at
        )

    advertiser_ranking: list[dict] = []
    total_buscas_concluidas = len(ids_buscas_concluidas)
    for item in ranking_anunciantes.values():
        aparicoes_em_buscas = len(item["search_runs"] & ids_buscas_concluidas)
        advertiser_ranking.append(
            {
                "advertiser_id": item["advertiser_id"],
                "advertiser": item["advertiser"],
                "domain": item["domain"],
                "observations": item["observations"],
                "unique_ads_observed": len(item["unique_ads"]),
                "search_runs_with_presence": aparicoes_em_buscas,
                "observed_presence_rate": round(
                    100 * aparicoes_em_buscas / total_buscas_concluidas, 1
                )
                if total_buscas_concluidas
                else 0.0,
                "landing_pages_observed": len(item["landing_pages"]),
                "queries_observed": len(item["queries"]),
                "regions_observed": len(item["locations"]),
                "devices_observed": sorted(item["devices"]),
                "locations": sorted(item["locations"], key=str.casefold),
                "first_observed_at": item["first_observed_at"],
                "last_observed_at": item["last_observed_at"],
            }
        )
    advertiser_ranking.sort(
        key=lambda item: (
            -item["observations"],
            -item["unique_ads_observed"],
            item["advertiser"].casefold(),
        )
    )
    advertiser_ranking = advertiser_ranking[:25]
    for posicao, item in enumerate(advertiser_ranking, start=1):
        item["rank"] = posicao

    ranking_consultas: dict[str, dict[str, Any]] = {}
    for busca in buscas:
        consulta = _consulta_da_busca(busca)
        chave = _normalizar_texto(consulta)
        item = ranking_consultas.setdefault(
            chave,
            {
                "query": consulta,
                "search_runs": set(),
                "completed_runs": set(),
                "failed_runs": set(),
                "observations": 0,
                "unique_ads": set(),
                "advertisers": set(),
                "locations": set(),
                "devices": set(),
                "last_searched_at": busca.requested_at,
            },
        )
        item["search_runs"].add(busca.id)
        if busca.status == "completed":
            item["completed_runs"].add(busca.id)
        elif busca.status == "failed":
            item["failed_runs"].add(busca.id)
        item["locations"].add(busca.region_name)
        item["devices"].add(busca.device)
        item["last_searched_at"] = max(
            item["last_searched_at"], busca.requested_at
        )

    for observacao, anunciante, _, busca in linhas:
        item = ranking_consultas[_normalizar_texto(_consulta_da_busca(busca))]
        item["observations"] += 1
        item["unique_ads"].add(_assinatura_anuncio(observacao))
        item["advertisers"].add(anunciante.id)

    query_ranking = [
        {
            "query": item["query"],
            "search_runs": len(item["search_runs"]),
            "completed_runs": len(item["completed_runs"]),
            "failed_runs": len(item["failed_runs"]),
            "observations": item["observations"],
            "unique_ads_observed": len(item["unique_ads"]),
            "advertisers_observed": len(item["advertisers"]),
            "locations": sorted(item["locations"], key=str.casefold),
            "devices": sorted(item["devices"], key=str.casefold),
            "last_searched_at": item["last_searched_at"],
        }
        for item in ranking_consultas.values()
    ]
    query_ranking.sort(
        key=lambda item: (
            -item["observations"],
            -item["unique_ads_observed"],
            item["query"].casefold(),
        )
    )

    timeline_map: dict[str, dict[str, Any]] = {}
    for deslocamento in range(days):
        data = (inicio.date() + timedelta(days=deslocamento)).isoformat()
        timeline_map[data] = {
            "date": data,
            "search_runs": set(),
            "completed_runs": set(),
            "failed_runs": set(),
            "observations": 0,
            "unique_ads": set(),
            "advertisers": set(),
        }
    for busca in buscas:
        data = busca.requested_at.astimezone(timezone.utc).date().isoformat()
        if data not in timeline_map:
            continue
        timeline_map[data]["search_runs"].add(busca.id)
        if busca.status == "completed":
            timeline_map[data]["completed_runs"].add(busca.id)
        elif busca.status == "failed":
            timeline_map[data]["failed_runs"].add(busca.id)
    for observacao, anunciante, _, _ in linhas:
        data = observacao.observed_at.astimezone(timezone.utc).date().isoformat()
        if data not in timeline_map:
            continue
        timeline_map[data]["observations"] += 1
        timeline_map[data]["unique_ads"].add(_assinatura_anuncio(observacao))
        timeline_map[data]["advertisers"].add(anunciante.id)
    timeline = [
        {
            "date": item["date"],
            "search_runs": len(item["search_runs"]),
            "completed_runs": len(item["completed_runs"]),
            "failed_runs": len(item["failed_runs"]),
            "observations": item["observations"],
            "unique_ads_observed": len(item["unique_ads"]),
            "advertisers_observed": len(item["advertisers"]),
        }
        for item in timeline_map.values()
    ]

    recentes = linhas[:100]
    landing_page_ids = {
        pagina.id for _, _, pagina, _ in recentes if pagina is not None
    }
    snapshots = await _ultimos_snapshots(session, landing_page_ids)
    recent_observations = [
        _observacao_json(
            linha,
            snapshots.get(linha[2].id) if linha[2] is not None else None,
        )
        for linha in recentes
    ]

    coverage = {
        "period_days": days,
        "window_start": inicio,
        "window_end": agora,
        "search_runs": len(buscas),
        "completed_search_runs": total_buscas_concluidas,
        "failed_search_runs": sum(busca.status == "failed" for busca in buscas),
        "pending_search_runs": sum(busca.status == "pending" for busca in buscas),
        "search_runs_with_observations": len(ids_buscas_observadas),
        "observations": len(linhas),
        "unique_ads_observed": len(assinaturas),
        "advertisers_observed": len(anunciantes),
        "landing_pages_observed": len(paginas),
        "queries_searched": len(consultas),
        "completed_queries_searched": len(consultas_concluidas),
        "locations_searched": len(locais),
        "devices_searched": len(dispositivos),
        "last_search_at": max(
            (busca.requested_at for busca in buscas), default=None
        ),
        "last_observation_at": max(
            (linha[0].observed_at for linha in linhas), default=None
        ),
        "filters": {
            "service": service,
            "location": [
                item.strip() for item in (location or "").split(",") if item.strip()
            ],
            "device": device,
        },
    }

    executive_summary: list[dict[str, str]] = []
    if linhas:
        executive_summary.append(
            {
                "kind": "observed",
                "text": (
                    f"Foram registradas {len(linhas)} observações em "
                    f"{total_buscas_concluidas} buscas concluídas no período."
                ),
            }
        )
        executive_summary.append(
            {
                "kind": "derived",
                "text": (
                    f"As observações representam {len(assinaturas)} variações "
                    "únicas pela combinação de título, descrição e URL de destino."
                ),
            }
        )
        if advertiser_ranking:
            lider = advertiser_ranking[0]
            executive_summary.append(
                {
                    "kind": "derived",
                    "text": (
                        f"{lider['advertiser']} teve a maior presença observada: "
                        f"{lider['observations']} registros em "
                        f"{lider['search_runs_with_presence']} buscas concluídas."
                    ),
                }
            )
    else:
        executive_summary.extend(
            (
                {
                    "kind": "observed",
                    "text": "Nenhum anúncio foi observado com os filtros selecionados.",
                },
                {
                    "kind": "derived",
                    "text": (
                        "A ausência de observações não comprova ausência de anúncios "
                        "no mercado; ela vale apenas para as buscas executadas."
                    ),
                },
            )
        )

    return {
        "generated_at": agora,
        "coverage": coverage,
        "executive_summary": executive_summary,
        "advertiser_ranking": advertiser_ranking,
        "query_ranking": query_ranking,
        "timeline": timeline,
        "recent_observations": recent_observations,
        "methodology": {
            "scope": (
                "O painel resume anúncios públicos observados nas consultas executadas; "
                "não representa o total absoluto de anúncios ou investimento do mercado."
            ),
            "observation": (
                "Uma observação é um anúncio retornado em uma combinação de consulta, "
                "local, dispositivo e momento."
            ),
            "unique_ad": (
                "Anúncio único observado é uma deduplicação derivada de título, "
                "descrição e URL de destino normalizados dentro do período."
            ),
            "presence_rate": (
                "Presença observada é a proporção de buscas concluídas em que o "
                "anunciante apareceu; não é participação de mercado nem impression share."
            ),
            "queries": (
                "O ranking de consultas mostra termos pesquisados pelo Radar e não "
                "revela as palavras-chave compradas pelo concorrente."
            ),
            "snapshot": (
                "O snapshot exibido é a captura mais recente disponível para a "
                "landing page vinculada à observação."
            ),
            "confidence": {
                "observed": "Valor diretamente contado nos registros coletados.",
                "derived": "Cálculo ou leitura produzida a partir dos registros observados.",
            },
        },
        "filter_options": await _opcoes_filtro(session),
    }
