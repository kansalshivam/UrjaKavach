"""add_geopolitical_alerts

Revision ID: 0006_add_geopolitical_alerts
Revises: 0005_add_security_audit_logs
Create Date: 2026-07-15 13:52:37

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '0006_add_geopolitical_alerts'
down_revision: Union[str, None] = '0005_add_security_audit_logs'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('geopolitical_alerts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('corridor', sa.Text(), nullable=False),
        sa.Column('alert_type', sa.Text(), nullable=False),
        sa.Column('triggered_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('value', sa.Double(), nullable=False),
        sa.Column('threshold', sa.Double(), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('raw_payload', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_geopolitical_alerts_corridor'), 'geopolitical_alerts', ['corridor'], unique=False)
    op.create_index('ix_geopolitical_alerts_corridor_triggered_at', 'geopolitical_alerts', ['corridor', 'triggered_at'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_geopolitical_alerts_corridor_triggered_at', table_name='geopolitical_alerts')
    op.drop_index(op.f('ix_geopolitical_alerts_corridor'), table_name='geopolitical_alerts')
    op.drop_table('geopolitical_alerts')
