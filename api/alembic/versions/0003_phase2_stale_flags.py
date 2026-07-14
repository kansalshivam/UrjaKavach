"""phase 2 stale flags

Revision ID: 0003_phase2_stale_flags
Revises: 0002_phase2_ingestion_staging
Create Date: 2026-07-14
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0003_phase2_stale_flags"
down_revision: Union[str, None] = "0002_phase2_ingestion_staging"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("risk_scores", sa.Column("component_gdelt_stale", sa.Boolean(), nullable=False, server_default="false"))
    op.add_column("risk_scores", sa.Column("component_price_stale", sa.Boolean(), nullable=False, server_default="false"))
    op.add_column("risk_scores", sa.Column("component_ais_stale", sa.Boolean(), nullable=False, server_default="false"))
    op.add_column("risk_scores", sa.Column("component_sanctions_stale", sa.Boolean(), nullable=False, server_default="false"))


def downgrade() -> None:
    op.drop_column("risk_scores", "component_gdelt_stale")
    op.drop_column("risk_scores", "component_price_stale")
    op.drop_column("risk_scores", "component_ais_stale")
    op.drop_column("risk_scores", "component_sanctions_stale")
