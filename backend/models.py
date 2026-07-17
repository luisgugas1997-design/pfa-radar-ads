from datetime import datetime
from typing import Any

from sqlalchemy import (
    BigInteger,
    CHAR,
    DateTime,
    ForeignKey,
    Integer,
    SmallInteger,
    String,
    Text,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class SearchRun(Base):
    __tablename__ = "search_runs"
    __table_args__ = {"schema": "radar"}

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    service_name: Mapped[str] = mapped_column(String(120))
    region_name: Mapped[str] = mapped_column(String(160))
    device: Mapped[str] = mapped_column(String(10))
    keyword: Mapped[str | None] = mapped_column(String(255))
    provider: Mapped[str] = mapped_column(
        String(40), server_default=text("'serpapi'")
    )
    provider_search_id: Mapped[str | None] = mapped_column(String(120))
    status: Mapped[str] = mapped_column(
        String(20), server_default=text("'pending'")
    )
    ads_found: Mapped[int] = mapped_column(
        Integer, server_default=text("0")
    )
    requested_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    error_message: Mapped[str | None] = mapped_column(Text)

    observations: Mapped[list["AdObservation"]] = relationship(
        back_populates="search_run"
    )
    usage_events: Mapped[list["ProviderUsageEvent"]] = relationship(
        back_populates="search_run"
    )


class Advertiser(Base):
    __tablename__ = "advertisers"
    __table_args__ = {"schema": "radar"}

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    display_name: Mapped[str | None] = mapped_column(String(255))
    domain: Mapped[str] = mapped_column(String(255), unique=True)
    first_seen_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    observations: Mapped[list["AdObservation"]] = relationship(
        back_populates="advertiser"
    )


class LandingPage(Base):
    __tablename__ = "landing_pages"
    __table_args__ = {"schema": "radar"}

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    canonical_url: Mapped[str] = mapped_column(Text, unique=True)
    domain: Mapped[str] = mapped_column(String(255))
    first_seen_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    observations: Mapped[list["AdObservation"]] = relationship(
        back_populates="landing_page"
    )
    snapshots: Mapped[list["LandingPageSnapshot"]] = relationship(
        back_populates="landing_page"
    )


class AdObservation(Base):
    __tablename__ = "ad_observations"
    __table_args__ = (
        UniqueConstraint(
            "search_run_id",
            "fingerprint",
            name="ad_observations_search_fingerprint_unique",
        ),
        {"schema": "radar"},
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    search_run_id: Mapped[int] = mapped_column(
        ForeignKey("radar.search_runs.id")
    )
    advertiser_id: Mapped[int] = mapped_column(
        ForeignKey("radar.advertisers.id")
    )
    landing_page_id: Mapped[int | None] = mapped_column(
        ForeignKey("radar.landing_pages.id")
    )
    fingerprint: Mapped[str] = mapped_column(CHAR(64))
    title: Mapped[str] = mapped_column(Text)
    description: Mapped[str | None] = mapped_column(Text)
    position_block: Mapped[str] = mapped_column(
        String(20), server_default=text("'unknown'")
    )
    position_index: Mapped[int | None] = mapped_column(SmallInteger)
    displayed_url: Mapped[str | None] = mapped_column(Text)
    target_url: Mapped[str] = mapped_column(Text)
    phone: Mapped[str | None] = mapped_column(String(60))
    sitelinks: Mapped[list[dict[str, Any]]] = mapped_column(
        JSONB, server_default=text("'[]'::jsonb")
    )
    observed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    raw_payload: Mapped[dict[str, Any]] = mapped_column(
        JSONB, server_default=text("'{}'::jsonb")
    )

    search_run: Mapped["SearchRun"] = relationship(back_populates="observations")
    advertiser: Mapped["Advertiser"] = relationship(back_populates="observations")
    landing_page: Mapped["LandingPage | None"] = relationship(
        back_populates="observations"
    )
    snapshots: Mapped[list["LandingPageSnapshot"]] = relationship(
        back_populates="ad_observation"
    )


class LandingPageSnapshot(Base):
    __tablename__ = "landing_page_snapshots"
    __table_args__ = {"schema": "radar"}

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    landing_page_id: Mapped[int] = mapped_column(
        ForeignKey("radar.landing_pages.id")
    )
    ad_observation_id: Mapped[int | None] = mapped_column(
        ForeignKey("radar.ad_observations.id")
    )
    capture_status: Mapped[str] = mapped_column(
        String(20), server_default=text("'pending'")
    )
    original_url: Mapped[str] = mapped_column(Text)
    final_url: Mapped[str | None] = mapped_column(Text)
    http_status: Mapped[int | None] = mapped_column(SmallInteger)
    page_title: Mapped[str | None] = mapped_column(Text)
    meta_description: Mapped[str | None] = mapped_column(Text)
    canonical_url: Mapped[str | None] = mapped_column(Text)
    h1: Mapped[str | None] = mapped_column(Text)
    h2: Mapped[list[str]] = mapped_column(
        JSONB, server_default=text("'[]'::jsonb")
    )
    headline: Mapped[str | None] = mapped_column(Text)
    subtitle: Mapped[str | None] = mapped_column(Text)
    primary_cta: Mapped[str | None] = mapped_column(Text)
    whatsapp_url: Mapped[str | None] = mapped_column(Text)
    whatsapp_links: Mapped[list[str]] = mapped_column(
        JSONB, server_default=text("'[]'::jsonb")
    )
    form_fields: Mapped[list[dict[str, Any]]] = mapped_column(
        JSONB, server_default=text("'[]'::jsonb")
    )
    faq_entries: Mapped[list[dict[str, Any]]] = mapped_column(
        JSONB, server_default=text("'[]'::jsonb")
    )
    social_proof: Mapped[list[dict[str, Any]]] = mapped_column(
        JSONB, server_default=text("'[]'::jsonb")
    )
    urgency_signals: Mapped[list[dict[str, Any]]] = mapped_column(
        JSONB, server_default=text("'[]'::jsonb")
    )
    authority_signals: Mapped[list[dict[str, Any]]] = mapped_column(
        JSONB, server_default=text("'[]'::jsonb")
    )
    screenshot_path: Mapped[str | None] = mapped_column(Text)
    html_path: Mapped[str | None] = mapped_column(Text)
    content_hash: Mapped[str | None] = mapped_column(CHAR(64))
    dom_hash: Mapped[str | None] = mapped_column(CHAR(64))
    captured_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    error_message: Mapped[str | None] = mapped_column(Text)

    landing_page: Mapped["LandingPage"] = relationship(back_populates="snapshots")
    ad_observation: Mapped["AdObservation | None"] = relationship(
        back_populates="snapshots"
    )


class ProviderUsageEvent(Base):
    __tablename__ = "provider_usage_events"
    __table_args__ = {"schema": "radar"}

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    search_run_id: Mapped[int | None] = mapped_column(
        ForeignKey("radar.search_runs.id")
    )
    provider: Mapped[str] = mapped_column(
        String(40), server_default=text("'serpapi'")
    )
    credits_consumed: Mapped[int] = mapped_column(
        SmallInteger, server_default=text("0")
    )
    monthly_limit: Mapped[int | None] = mapped_column(Integer)
    remaining_credits: Mapped[int | None] = mapped_column(Integer)
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    search_run: Mapped["SearchRun | None"] = relationship(
        back_populates="usage_events"
    )
