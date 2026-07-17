import asyncio
import hashlib
import ipaddress
import socket
import uuid
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

from playwright.async_api import Page, async_playwright


WHATSAPP_SELECTOR = (
    'a[href*="wa.me"], '
    'a[href*="whatsapp.com"], '
    'a[href*="whatsapp://"]'
)


def _validar_url_publica(url: str) -> None:
    analisada = urlparse(url)
    if analisada.scheme not in {"http", "https"} or not analisada.hostname:
        raise ValueError("A landing page precisa usar uma URL HTTP ou HTTPS válida.")
    host = analisada.hostname.casefold()
    if host == "localhost" or host.endswith(".localhost") or host.endswith(".local"):
        raise ValueError("A landing page precisa apontar para um endereço público.")
    try:
        endereco = ipaddress.ip_address(host)
    except ValueError:
        return
    if not endereco.is_global:
        raise ValueError("A landing page precisa apontar para um endereço público.")


async def _host_resolve_para_rede_publica(
    host: str,
    cache: dict[str, bool],
) -> bool:
    host_normalizado = host.casefold().rstrip(".")
    if host_normalizado in cache:
        return cache[host_normalizado]
    if (
        host_normalizado == "localhost"
        or host_normalizado.endswith(".localhost")
        or host_normalizado.endswith(".local")
    ):
        cache[host_normalizado] = False
        return False
    try:
        endereco_literal = ipaddress.ip_address(host_normalizado)
        publico = endereco_literal.is_global
    except ValueError:
        try:
            respostas = await asyncio.to_thread(
                socket.getaddrinfo,
                host_normalizado,
                None,
                socket.AF_UNSPEC,
                socket.SOCK_STREAM,
            )
            enderecos = {
                resposta[4][0].split("%", 1)[0]
                for resposta in respostas
                if resposta[4]
            }
            publico = bool(enderecos) and all(
                ipaddress.ip_address(endereco).is_global
                for endereco in enderecos
            )
        except (OSError, ValueError):
            publico = False
    cache[host_normalizado] = publico
    return publico


async def _url_resolve_para_rede_publica(
    url: str,
    cache: dict[str, bool],
) -> bool:
    analisada = urlparse(url)
    if analisada.scheme in {"about", "blob", "data"}:
        return True
    if analisada.scheme not in {"http", "https"} or not analisada.hostname:
        return False
    return await _host_resolve_para_rede_publica(analisada.hostname, cache)


async def _texto_primeiro(page: Page, seletor: str) -> str | None:
    localizador = page.locator(seletor).first
    if not await localizador.count():
        return None
    texto = await localizador.text_content()
    return texto.strip() if texto and texto.strip() else None


async def _meta_content(page: Page, seletor: str) -> str | None:
    localizador = page.locator(seletor).first
    if not await localizador.count():
        return None
    valor = await localizador.get_attribute("content")
    return valor.strip() if valor and valor.strip() else None


async def capturar_landing_page(
    url: str,
    output_dir: str = "screenshots",
) -> dict[str, Any]:
    """Lê uma landing page passivamente e registra um snapshot verificável."""
    try:
        _validar_url_publica(url)
    except ValueError as erro:
        return {"status": "erro", "erro": str(erro), "original_url": url}

    pasta_saida = Path(output_dir)
    pasta_saida.mkdir(parents=True, exist_ok=True)

    try:
        async with async_playwright() as playwright:
            browser = await playwright.chromium.launch(headless=True)
            try:
                contexto = await browser.new_context(
                    viewport={"width": 1440, "height": 1000},
                    locale="pt-BR",
                    service_workers="block",
                )
                cache_dns: dict[str, bool] = {}

                async def proteger_requisicao(route) -> None:
                    if await _url_resolve_para_rede_publica(
                        route.request.url,
                        cache_dns,
                    ):
                        await route.continue_()
                    else:
                        await route.abort("blockedbyclient")

                await contexto.route("**/*", proteger_requisicao)
                page = await contexto.new_page()
                resposta = await page.goto(
                    url,
                    timeout=20_000,
                    wait_until="domcontentloaded",
                )
                if not await _url_resolve_para_rede_publica(page.url, cache_dns):
                    raise ValueError(
                        "A landing page redirecionou para um endereço não público."
                    )

                h1 = await _texto_primeiro(page, "h1")
                h2 = [
                    texto.strip()
                    for texto in await page.locator("h2").all_text_contents()
                    if texto.strip()
                ]
                whatsapp_links = await page.locator(WHATSAPP_SELECTOR).evaluate_all(
                    "links => [...new Set(links.map(link => link.href).filter(Boolean))]"
                )

                ctas = await page.locator(
                    "a, button, input[type='submit'], input[type='button']"
                ).evaluate_all(
                    """
                    elements => elements.map(element => ({
                      text: (element.innerText || element.value || '').trim(),
                      href: element.href || null
                    })).filter(item => item.text).slice(0, 80)
                    """
                )
                termos_cta = (
                    "whatsapp",
                    "fale",
                    "análise",
                    "analise",
                    "consulta",
                    "contato",
                    "saiba",
                    "começar",
                    "comecar",
                )
                primary_cta = next(
                    (
                        item["text"]
                        for item in ctas
                        if any(termo in item["text"].casefold() for termo in termos_cta)
                    ),
                    ctas[0]["text"] if ctas else None,
                )

                form_fields = await page.locator("form").evaluate_all(
                    """
                    forms => forms.map(form => ({
                      action: form.action || null,
                      method: (form.method || 'get').toLowerCase(),
                      fields: [...form.querySelectorAll('input, select, textarea')].map(field => ({
                        name: field.name || null,
                        type: field.type || field.tagName.toLowerCase(),
                        placeholder: field.placeholder || null,
                        required: Boolean(field.required)
                      }))
                    })).slice(0, 10)
                    """
                )

                faq_entries = await page.locator("details").evaluate_all(
                    """
                    entries => entries.map(entry => ({
                      question: (entry.querySelector('summary')?.innerText || '').trim(),
                      answer: [...entry.children]
                        .filter(child => child.tagName !== 'SUMMARY')
                        .map(child => child.innerText || '')
                        .join(' ')
                        .trim()
                    })).filter(item => item.question).slice(0, 30)
                    """
                )

                texto_pagina = " ".join(
                    (await page.locator("body").inner_text()).split()
                )[:250_000]
                texto_normalizado = texto_pagina.casefold()

                def sinais(rotulos: dict[str, tuple[str, ...]]) -> list[dict[str, str]]:
                    return [
                        {"type": rotulo, "evidence": termo}
                        for rotulo, termos in rotulos.items()
                        for termo in termos
                        if termo in texto_normalizado
                    ][:12]

                social_proof = sinais(
                    {
                        "depoimento": ("depoimento", "avaliações", "avaliacoes"),
                        "resultado": ("clientes atendidos", "casos atendidos"),
                    }
                )
                urgency_signals = sinais(
                    {
                        "urgencia": ("urgente", "últimas vagas", "ultimas vagas"),
                        "prazo": ("prazo", "hoje", "agora"),
                    }
                )
                authority_signals = sinais(
                    {
                        "especialidade": ("especialista", "especializado"),
                        "experiencia": ("anos de experiência", "anos de experiencia"),
                        "credencial": ("oab", "advogado"),
                    }
                )

                html = await page.content()
                nome_arquivo = f"landing-page-{uuid.uuid4().hex}.png"
                screenshot_path = pasta_saida / nome_arquivo
                await page.screenshot(path=str(screenshot_path), full_page=True)

                canonical = page.locator("link[rel='canonical']").first
                canonical_url = (
                    await canonical.get_attribute("href")
                    if await canonical.count()
                    else None
                )

                return {
                    "status": "sucesso",
                    "original_url": url,
                    "final_url": page.url,
                    "http_status": resposta.status if resposta else None,
                    "page_title": (await page.title()).strip() or None,
                    "meta_description": await _meta_content(
                        page, "meta[name='description']"
                    ),
                    "canonical_url": canonical_url,
                    "h1": h1,
                    "h2": h2,
                    "headline": h1,
                    "subtitle": h2[0] if h2 else None,
                    "primary_cta": primary_cta,
                    "whatsapp_links": whatsapp_links,
                    "form_fields": form_fields,
                    "faq_entries": faq_entries,
                    "social_proof": social_proof,
                    "urgency_signals": urgency_signals,
                    "authority_signals": authority_signals,
                    "screenshot_path": str(screenshot_path),
                    "content_hash": hashlib.sha256(
                        texto_pagina.encode("utf-8")
                    ).hexdigest(),
                    "dom_hash": hashlib.sha256(html.encode("utf-8")).hexdigest(),
                }
            finally:
                await browser.close()
    except Exception as erro:
        return {
            "status": "erro",
            "erro": str(erro)[:2000],
            "original_url": url,
        }
