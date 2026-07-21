import os
from pathlib import Path
from typing import AsyncGenerator

from dotenv import load_dotenv
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from backend.models import Base


load_dotenv(Path(__file__).resolve().parent / ".env")

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL não configurada.")


engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


async def initialize_database() -> None:
    """Cria a estrutura do Radar quando ela ainda não existir."""
    async with engine.begin() as connection:
        await connection.execute(text("CREATE SCHEMA IF NOT EXISTS radar"))
        await connection.execute(text("CREATE SCHEMA IF NOT EXISTS client_portal"))
        await connection.run_sync(Base.metadata.create_all)
        await connection.execute(
            text(
                """
                ALTER TABLE radar.landing_page_snapshots
                ADD COLUMN IF NOT EXISTS h2 JSONB NOT NULL DEFAULT '[]'::jsonb,
                ADD COLUMN IF NOT EXISTS whatsapp_links JSONB NOT NULL DEFAULT '[]'::jsonb
                """
            )
        )


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    session = AsyncSessionLocal()
    try:
        yield session
    finally:
        await session.close()
