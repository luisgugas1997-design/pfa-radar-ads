import os
import uuid
from typing import Any

from playwright.async_api import async_playwright


async def capturar_landing_page(
    url: str,
    output_dir: str = "screenshots",
) -> dict[str, Any]:
    os.makedirs(output_dir, exist_ok=True)

    try:
        async with async_playwright() as playwright:
            browser = await playwright.chromium.launch(headless=True)

            try:
                page = await browser.new_page()
                await page.goto(url, timeout=15_000, wait_until="domcontentloaded")

                h1_element = page.locator("h1").first
                h1 = await h1_element.text_content() if await h1_element.count() else None
                h1 = h1.strip() if h1 else None

                h2 = await page.locator("h2").all_text_contents()
                h2 = [texto.strip() for texto in h2 if texto.strip()]

                whatsapp_links = await page.locator(
                    'a[href*="wa.me"], '
                    'a[href*="api.whatsapp.com"], '
                    'a[href*="whatsapp://"]'
                ).evaluate_all("links => links.map(link => link.href)")

                screenshot_path = os.path.join(
                    output_dir,
                    f"landing-page-{uuid.uuid4().hex}.png",
                )
                await page.screenshot(path=screenshot_path, full_page=True)

                return {
                    "status": "sucesso",
                    "h1": h1,
                    "h2": h2,
                    "whatsapp_links": whatsapp_links,
                    "screenshot_path": screenshot_path,
                }
            finally:
                await browser.close()
    except Exception as erro:
        return {
            "status": "erro",
            "erro": str(erro),
        }
