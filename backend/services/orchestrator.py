from datetime import datetime, timezone
from hashlib import sha256
from urllib.parse import parse_qs, urlparse

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models import (
    AdObservation,
    Advertiser,
    LandingPage,
    LandingPageSnapshot,
    SearchRun,
)
from backend.services.scraper import capturar_landing_page
from backend.services.serpapi_service import buscar_anuncios_google


def extrair_url_destino(link: object) -> str | None:
    if not isinstance(link, str):
        return None

    url_analisada = urlparse(link)
    if url_analisada.scheme not in {"http", "https"}:
        return None

    host = (url_analisada.hostname or "").lower()
    caminho = url_analisada.path.rstrip("/")
    host_google = (
        host in {"google.com", "google.com.br", "googleadservices.com"}
        or host.endswith(".google.com")
        or host.endswith(".google.com.br")
        or host.endswith(".googleadservices.com")
    )
    link_rastreador_google = caminho.endswith("/aclk") and host_google
    if not link_rastreador_google:
        return link

    url_destino = (parse_qs(url_analisada.query).get("adurl") or [None])[0]
    if not isinstance(url_destino, str):
        return None

    destino_analisado = urlparse(url_destino)
    if (
        destino_analisado.scheme not in {"http", "https"}
        or not destino_analisado.hostname
    ):
        return None
    return url_destino


async def executar_varredura(
    session: AsyncSession,
    keyword: str,
    location: str,
    device: str,
    service_name: str | None = None,
) -> SearchRun:
    search_run = SearchRun(
        service_name=(service_name or keyword).strip(),
        region_name=location,
        device=device,
        keyword=keyword,
        status="pending",
    )
    session.add(search_run)
    await session.commit()
    await session.refresh(search_run)
    search_run_id = search_run.id

    provider_search_id = None
    try:
        resultado_serpapi = await buscar_anuncios_google(keyword, location, device)
        provider_search_id = resultado_serpapi.search_id
        search_run.provider_search_id = provider_search_id
        anuncios = resultado_serpapi.anuncios
        anuncios_persistidos = 0
        landing_pages_capturadas: set[int] = set()

        for anuncio in anuncios:
            target_url = extrair_url_destino(anuncio.get("link"))
            if target_url is None:
                continue

            dominio = urlparse(target_url).netloc.lower().removeprefix("www.")
            if not dominio:
                continue

            advertiser = await session.scalar(
                select(Advertiser).where(Advertiser.domain == dominio)
            )
            if advertiser is None:
                advertiser = Advertiser(
                    display_name=anuncio.get("source"),
                    domain=dominio,
                )
                session.add(advertiser)
            elif not advertiser.display_name and anuncio.get("source"):
                advertiser.display_name = anuncio.get("source")

            landing_page = await session.scalar(
                select(LandingPage).where(
                    LandingPage.canonical_url == target_url
                )
            )
            if landing_page is None:
                landing_page = LandingPage(
                    canonical_url=target_url,
                    domain=dominio,
                )
                session.add(landing_page)

            await session.flush()

            resultado_scraper = None
            if landing_page.id not in landing_pages_capturadas:
                landing_pages_capturadas.add(landing_page.id)
                resultado_scraper = await capturar_landing_page(target_url)

            titulo = anuncio.get("title") or ""
            descricao = anuncio.get("description") or anuncio.get("snippet")
            fingerprint = sha256(
                f"{titulo}|{descricao or ''}|{target_url}".encode()
            ).hexdigest()

            observacao_existente = await session.scalar(
                select(AdObservation).where(
                    AdObservation.search_run_id == search_run.id,
                    AdObservation.fingerprint == fingerprint,
                )
            )
            if observacao_existente is not None:
                continue

            posicao = anuncio.get("position")
            posicao_indice = posicao if isinstance(posicao, int) and posicao > 0 else None
            bloco = str(anuncio.get("block_position", "unknown")).lower()
            if bloco not in {"top", "middle", "bottom"}:
                bloco = "unknown"

            sitelinks = anuncio.get("sitelinks")
            if not isinstance(sitelinks, list):
                sitelinks = []

            observacao = AdObservation(
                search_run_id=search_run.id,
                advertiser_id=advertiser.id,
                landing_page_id=landing_page.id,
                fingerprint=fingerprint,
                title=titulo,
                description=descricao,
                position_block=bloco,
                position_index=posicao_indice,
                displayed_url=anuncio.get("displayed_link"),
                target_url=target_url,
                phone=anuncio.get("phone"),
                sitelinks=sitelinks,
                raw_payload=anuncio,
            )
            session.add(observacao)
            await session.flush()

            if resultado_scraper:
                whatsapp_links = resultado_scraper.get("whatsapp_links", [])
                if not isinstance(whatsapp_links, list):
                    whatsapp_links = []

                h2 = resultado_scraper.get("h2", [])
                if not isinstance(h2, list):
                    h2 = []

                captura_sucesso = resultado_scraper.get("status") == "sucesso"
                session.add(
                    LandingPageSnapshot(
                        landing_page_id=landing_page.id,
                        ad_observation_id=observacao.id,
                        capture_status="captured" if captura_sucesso else "failed",
                        original_url=target_url,
                        final_url=resultado_scraper.get("final_url"),
                        http_status=resultado_scraper.get("http_status"),
                        page_title=resultado_scraper.get("page_title"),
                        meta_description=resultado_scraper.get("meta_description"),
                        canonical_url=resultado_scraper.get("canonical_url"),
                        h1=resultado_scraper.get("h1"),
                        h2=h2,
                        headline=resultado_scraper.get("headline"),
                        subtitle=resultado_scraper.get("subtitle"),
                        primary_cta=resultado_scraper.get("primary_cta"),
                        whatsapp_url=whatsapp_links[0] if whatsapp_links else None,
                        whatsapp_links=whatsapp_links,
                        form_fields=resultado_scraper.get("form_fields") or [],
                        faq_entries=resultado_scraper.get("faq_entries") or [],
                        social_proof=resultado_scraper.get("social_proof") or [],
                        urgency_signals=resultado_scraper.get("urgency_signals") or [],
                        authority_signals=resultado_scraper.get("authority_signals") or [],
                        screenshot_path=resultado_scraper.get("screenshot_path"),
                        content_hash=resultado_scraper.get("content_hash"),
                        dom_hash=resultado_scraper.get("dom_hash"),
                        error_message=(
                            None if captura_sucesso else resultado_scraper.get("erro")
                        ),
                    )
                )

            anuncios_persistidos += 1

        search_run.status = "completed"
        search_run.ads_found = anuncios_persistidos
        search_run.completed_at = datetime.now(timezone.utc)
        await session.commit()
        await session.refresh(search_run)
        return search_run

    except Exception as erro:
        await session.rollback()
        search_run_falhou = await session.get(SearchRun, search_run_id)
        if search_run_falhou is None:
            raise

        search_run_falhou.status = "failed"
        search_run_falhou.provider_search_id = provider_search_id
        search_run_falhou.error_message = str(erro)[:2000]
        await session.commit()
        raise
