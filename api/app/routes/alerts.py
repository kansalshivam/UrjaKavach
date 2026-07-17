import csv
import io
import json
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import GeopoliticalAlert
from app.db.session import get_session

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.get("")
async def list_alerts(
    corridor: str | None = Query(None, description="Filter by corridor"),
    limit: int = Query(50, ge=1, le=100),
    session: AsyncSession = Depends(get_session),
) -> dict:
    query = select(GeopoliticalAlert).order_by(GeopoliticalAlert.triggered_at.desc())
    if corridor:
        query = query.where(GeopoliticalAlert.corridor == corridor)
    query = query.limit(limit)

    res = await session.execute(query)
    alerts = res.scalars().all()

    return {
        "alerts": [
            {
                "id": a.id,
                "corridor": a.corridor,
                "alert_type": a.alert_type,
                "triggered_at": a.triggered_at.isoformat(),
                "value": a.value,
                "threshold": a.threshold,
                "description": a.description,
                "raw_payload": a.raw_payload,
            }
            for a in alerts
        ]
    }


def _escape_csv_field(val):
    if isinstance(val, str) and val and val[0] in ("=", "+", "-", "@"):
        return "'" + val
    return val


@router.get("/export")
async def export_alerts_csv(
    session: AsyncSession = Depends(get_session),
) -> StreamingResponse:
    query = select(GeopoliticalAlert).order_by(GeopoliticalAlert.triggered_at.desc())
    res = await session.execute(query)
    alerts = res.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)

    # Header
    writer.writerow([
        "ID",
        "Corridor",
        "Alert Type",
        "Triggered At",
        "Value",
        "Threshold",
        "Description",
        "Raw Payload",
    ])

    for a in alerts:
        payload_str = json.dumps(a.raw_payload) if a.raw_payload else ""
        writer.writerow([
            a.id,
            a.corridor,
            a.alert_type,
            a.triggered_at.isoformat(),
            a.value,
            a.threshold,
            _escape_csv_field(a.description),
            _escape_csv_field(payload_str),
        ])

    output.seek(0)
    response = StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=geopolitical_alerts.csv"},
    )
    return response
