import asyncio
from datetime import datetime, timezone

from backend.models import (
    AdObservation,
    Advertiser,
    LandingPage,
    LandingPageSnapshot,
    SearchRun,
)
from backend.services.competitor_service import (
    obter_perfil_anunciante_observado,
)


class ResultRows:
    def __init__(self, rows):
        self.rows = rows

    def all(self):
        return self.rows


class FakeProfileSession:
    def __init__(self, advertiser, rows, snapshots):
        self.advertiser = advertiser
        self.rows = rows
        self.snapshots = snapshots
        self.scalar_calls = 0

    async def get(self, model, identifier):
        assert model is Advertiser
        return self.advertiser if identifier == self.advertiser.id else None

    async def execute(self, _query):
        return ResultRows(self.rows)

    async def scalars(self, _query):
        self.scalar_calls += 1
        if self.scalar_calls == 1:
            return ResultRows([row[1].id for row in self.rows])
        return ResultRows(self.snapshots)


def test_perfil_robusto_agrega_evidencias_sem_distinct_on() -> None:
    observed_at = datetime.now(timezone.utc)
    advertiser = Advertiser(
        id=7,
        display_name="Concorrente",
        domain="concorrente.example",
        first_seen_at=observed_at,
    )
    search_run = SearchRun(
        id=3,
        service_name="Lei Seca",
        keyword="advogado lei seca",
        region_name="Santo André",
        device="mobile",
        status="completed",
        ads_found=1,
        requested_at=observed_at,
    )
    landing_page = LandingPage(
        id=11,
        canonical_url="https://concorrente.example/lei-seca",
        domain="concorrente.example",
        first_seen_at=observed_at,
    )
    observation = AdObservation(
        id=21,
        search_run_id=3,
        advertiser_id=7,
        landing_page_id=11,
        fingerprint="a" * 64,
        title="Defesa Lei Seca",
        description="Atendimento especializado",
        target_url=landing_page.canonical_url,
        observed_at=observed_at,
    )
    snapshot = LandingPageSnapshot(
        id=31,
        landing_page_id=11,
        original_url=landing_page.canonical_url,
        capture_status="captured",
        h1="Defesa especializada",
        whatsapp_links=["https://wa.me/5511000000000"],
        captured_at=observed_at,
    )
    session = FakeProfileSession(
        advertiser,
        [(observation, search_run, landing_page)],
        [snapshot],
    )

    profile = asyncio.run(
        obter_perfil_anunciante_observado(session, 7, days=30)
    )

    assert profile is not None
    assert profile["advertiser"]["unique_ads_observed"] == 1
    assert profile["queries"][0]["query_observed"] == "advogado lei seca"
    assert profile["creatives"][0]["title"] == "Defesa Lei Seca"
    assert profile["landing_pages"][0]["snapshot_count"] == 1
    assert profile["timeline"][0]["observations"] == 1

