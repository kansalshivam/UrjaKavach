"""foundation schema

Revision ID: 0001_foundation_schema
Revises:
Create Date: 2026-07-14
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0001_foundation_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "nodes",
        sa.Column("id", sa.Text(), primary_key=True),
        sa.Column("node_type", sa.Text(), nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("lat", sa.Double(), nullable=False),
        sa.Column("lon", sa.Double(), nullable=False),
        sa.Column("capacity_value", sa.Double(), nullable=True),
        sa.Column("capacity_unit", sa.Text(), nullable=True),
        sa.Column("source_note", sa.Text(), nullable=False),
    )
    op.create_table(
        "edges",
        sa.Column("id", sa.Text(), primary_key=True),
        sa.Column("from_node_id", sa.Text(), sa.ForeignKey("nodes.id"), nullable=False),
        sa.Column("to_node_id", sa.Text(), sa.ForeignKey("nodes.id"), nullable=False),
        sa.Column("edge_type", sa.Text(), nullable=False),
        sa.Column("capacity_value", sa.Double(), nullable=True),
        sa.Column("source_note", sa.Text(), nullable=False),
    )
    op.create_table(
        "risk_scores",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("corridor", sa.Text(), nullable=False),
        sa.Column("computed_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("score", sa.Double(), nullable=False),
        sa.Column("component_gdelt_volume", sa.Double(), nullable=True),
        sa.Column("component_price_volatility", sa.Double(), nullable=True),
        sa.Column("component_ais_deviation", sa.Double(), nullable=True),
        sa.Column("component_sanctions_flag", sa.Double(), nullable=True),
        sa.Column("weights_used", postgresql.JSONB(), nullable=False),
    )
    op.create_index("ix_risk_scores_corridor_computed_at", "risk_scores", ["corridor", "computed_at"])
    op.create_table(
        "ais_snapshots",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("captured_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("bounding_box", sa.Text(), nullable=False),
        sa.Column("vessel_count", sa.Integer(), nullable=False),
        sa.Column("raw_payload_path", sa.Text(), nullable=True),
    )
    op.create_index("ix_ais_snapshots_bounding_box_captured_at", "ais_snapshots", ["bounding_box", "captured_at"])
    op.create_table(
        "scenarios",
        sa.Column("id", sa.Text(), primary_key=True),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("ground_truth_source", sa.Text(), nullable=False),
    )
    op.create_table(
        "scenario_runs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("scenario_id", sa.Text(), sa.ForeignKey("scenarios.id"), nullable=False),
        sa.Column("capacity_available_pct", sa.Double(), nullable=False),
        sa.Column("run_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("projected_import_volume_change_pct", sa.Double(), nullable=True),
        sa.Column("projected_spr_days_cover", sa.Double(), nullable=True),
        sa.Column("narrative_text", sa.Text(), nullable=True),
    )
    op.create_index("ix_scenario_runs_scenario_id_run_at", "scenario_runs", ["scenario_id", "run_at"])


def downgrade() -> None:
    op.drop_index("ix_scenario_runs_scenario_id_run_at", table_name="scenario_runs")
    op.drop_table("scenario_runs")
    op.drop_table("scenarios")
    op.drop_index("ix_ais_snapshots_bounding_box_captured_at", table_name="ais_snapshots")
    op.drop_table("ais_snapshots")
    op.drop_index("ix_risk_scores_corridor_computed_at", table_name="risk_scores")
    op.drop_table("risk_scores")
    op.drop_table("edges")
    op.drop_table("nodes")



