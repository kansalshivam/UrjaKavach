"""phase 2 ingestion staging

Revision ID: 0002_phase2_ingestion_staging
Revises: 0001_foundation_schema
Create Date: 2026-07-14
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0002_phase2_ingestion_staging"
down_revision: Union[str, None] = "0001_foundation_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "gdelt_articles",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("corridor", sa.Text(), nullable=False),
        sa.Column("query", sa.Text(), nullable=False),
        sa.Column("fetched_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("url", sa.Text(), nullable=False),
        sa.Column("seendate", sa.Text(), nullable=True),
        sa.Column("domain", sa.Text(), nullable=True),
        sa.Column("language", sa.Text(), nullable=True),
        sa.Column("source_country", sa.Text(), nullable=True),
        sa.UniqueConstraint("url", name="uq_gdelt_articles_url"),
    )
    op.create_index("ix_gdelt_articles_corridor_fetched_at", "gdelt_articles", ["corridor", "fetched_at"])
    op.create_table(
        "price_points",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("fetched_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("source", sa.Text(), nullable=False),
        sa.Column("series", sa.Text(), nullable=False),
        sa.Column("period", sa.Text(), nullable=False),
        sa.Column("value", sa.Double(), nullable=True),
        sa.Column("units", sa.Text(), nullable=True),
        sa.UniqueConstraint("series", "period", name="uq_price_points_series_period"),
    )
    op.create_index("ix_price_points_series_period", "price_points", ["series", "period"])


def downgrade() -> None:
    op.drop_index("ix_price_points_series_period", table_name="price_points")
    op.drop_table("price_points")
    op.drop_index("ix_gdelt_articles_corridor_fetched_at", table_name="gdelt_articles")
    op.drop_table("gdelt_articles")
