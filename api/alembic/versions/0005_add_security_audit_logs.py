"""add_security_audit_logs

Revision ID: 0005
Revises: 0004
Create Date: 2026-07-15

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '0005_add_security_audit_logs'
down_revision: Union[str, None] = '0004_single_column_indices'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'security_audit_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('timestamp', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('operator_id', sa.Text(), server_default='IND-2026-OPS', nullable=False),
        sa.Column('action_source', sa.Text(), nullable=False),
        sa.Column('action_type', sa.Text(), nullable=False),
        sa.Column('payload', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('security_audit_logs')
