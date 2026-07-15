from datetime import datetime

from sqlalchemy import DateTime, Double, ForeignKey, Integer, Text, UniqueConstraint, Index, func, Boolean
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class Node(Base):
    __tablename__ = "nodes"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    node_type: Mapped[str] = mapped_column(Text, nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    lat: Mapped[float] = mapped_column(Double, nullable=False)
    lon: Mapped[float] = mapped_column(Double, nullable=False)
    capacity_value: Mapped[float | None] = mapped_column(Double)
    capacity_unit: Mapped[str | None] = mapped_column(Text)
    source_note: Mapped[str] = mapped_column(Text, nullable=False)

    outgoing_edges: Mapped[list["Edge"]] = relationship(
        "Edge",
        foreign_keys="Edge.from_node_id",
        back_populates="from_node",
    )
    incoming_edges: Mapped[list["Edge"]] = relationship(
        "Edge",
        foreign_keys="Edge.to_node_id",
        back_populates="to_node",
    )


class Edge(Base):
    __tablename__ = "edges"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    from_node_id: Mapped[str] = mapped_column(Text, ForeignKey("nodes.id"), nullable=False)
    to_node_id: Mapped[str] = mapped_column(Text, ForeignKey("nodes.id"), nullable=False)
    edge_type: Mapped[str] = mapped_column(Text, nullable=False)
    capacity_value: Mapped[float | None] = mapped_column(Double)
    source_note: Mapped[str] = mapped_column(Text, nullable=False)

    from_node: Mapped[Node] = relationship("Node", foreign_keys=[from_node_id], back_populates="outgoing_edges")
    to_node: Mapped[Node] = relationship("Node", foreign_keys=[to_node_id], back_populates="incoming_edges")


class RiskScore(Base):
    __tablename__ = "risk_scores"
    __table_args__ = (Index("ix_risk_scores_corridor_computed_at", "corridor", "computed_at"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    corridor: Mapped[str] = mapped_column(Text, nullable=False, index=True)
    computed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    score: Mapped[float] = mapped_column(Double, nullable=False)
    component_gdelt_volume: Mapped[float | None] = mapped_column(Double)
    component_price_volatility: Mapped[float | None] = mapped_column(Double)
    component_ais_deviation: Mapped[float | None] = mapped_column(Double)
    component_sanctions_flag: Mapped[float | None] = mapped_column(Double)
    weights_used: Mapped[dict] = mapped_column(JSONB, nullable=False)
    component_gdelt_stale: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    component_price_stale: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    component_ais_stale: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    component_sanctions_stale: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")


class GdeltArticle(Base):
    __tablename__ = "gdelt_articles"
    __table_args__ = (
        UniqueConstraint("url", name="uq_gdelt_articles_url"),
        Index("ix_gdelt_articles_corridor_fetched_at", "corridor", "fetched_at"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    corridor: Mapped[str] = mapped_column(Text, nullable=False, index=True)
    query: Mapped[str] = mapped_column(Text, nullable=False)
    fetched_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    url: Mapped[str] = mapped_column(Text, nullable=False)
    seendate: Mapped[str | None] = mapped_column(Text)
    domain: Mapped[str | None] = mapped_column(Text)
    language: Mapped[str | None] = mapped_column(Text)
    source_country: Mapped[str | None] = mapped_column(Text)


class PricePoint(Base):
    __tablename__ = "price_points"
    __table_args__ = (
        UniqueConstraint("series", "period", name="uq_price_points_series_period"),
        Index("ix_price_points_series_period", "series", "period"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    fetched_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    source: Mapped[str] = mapped_column(Text, nullable=False)
    series: Mapped[str] = mapped_column(Text, nullable=False)
    period: Mapped[str] = mapped_column(Text, nullable=False)
    value: Mapped[float | None] = mapped_column(Double)
    units: Mapped[str | None] = mapped_column(Text)


class AisSnapshot(Base):
    __tablename__ = "ais_snapshots"
    __table_args__ = (Index("ix_ais_snapshots_bounding_box_captured_at", "bounding_box", "captured_at"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    captured_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    bounding_box: Mapped[str] = mapped_column(Text, nullable=False, index=True)
    vessel_count: Mapped[int] = mapped_column(Integer, nullable=False)
    raw_payload_path: Mapped[str | None] = mapped_column(Text)


class Scenario(Base):
    __tablename__ = "scenarios"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    ground_truth_source: Mapped[str] = mapped_column(Text, nullable=False)


class ScenarioRun(Base):
    __tablename__ = "scenario_runs"
    __table_args__ = (Index("ix_scenario_runs_scenario_id_run_at", "scenario_id", "run_at"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    scenario_id: Mapped[str] = mapped_column(Text, ForeignKey("scenarios.id"), nullable=False, index=True)
    capacity_available_pct: Mapped[float] = mapped_column(Double, nullable=False)
    run_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    projected_import_volume_change_pct: Mapped[float | None] = mapped_column(Double)
    projected_spr_days_cover: Mapped[float | None] = mapped_column(Double)
    narrative_text: Mapped[str | None] = mapped_column(Text)


class SecurityAuditLog(Base):
    __tablename__ = "security_audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    operator_id: Mapped[str] = mapped_column(Text, nullable=False, default="IND-2026-OPS", server_default="IND-2026-OPS")
    action_source: Mapped[str] = mapped_column(Text, nullable=False)
    action_type: Mapped[str] = mapped_column(Text, nullable=False)
    payload: Mapped[dict] = mapped_column(JSONB, nullable=False)

