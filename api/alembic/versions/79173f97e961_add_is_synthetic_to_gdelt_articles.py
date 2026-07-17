"""add_is_synthetic_to_gdelt_articles

Revision ID: 79173f97e961
Revises: 0006_add_geopolitical_alerts
Create Date: 2026-07-16 02:41:01.335509

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '79173f97e961'
down_revision: Union[str, None] = '0006_add_geopolitical_alerts'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('gdelt_articles', sa.Column('is_synthetic', sa.Boolean(), server_default='false', nullable=False))


def downgrade() -> None:
    op.drop_column('gdelt_articles', 'is_synthetic')
