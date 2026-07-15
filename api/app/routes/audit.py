"""Security Audit Log routes."""
from __future__ import annotations

from datetime import datetime
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.db.models import SecurityAuditLog

router = APIRouter(prefix="/api/audit", tags=["audit"])


class AuditLogRequest(BaseModel):
    action_source: str
    action_type: str
    payload: dict


async def log_action(
    session: AsyncSession,
    action_source: str,
    action_type: str,
    payload: dict,
    operator_id: str = "IND-2026-OPS"
) -> SecurityAuditLog:
    """Helper function to insert a security audit log entry in the database."""
    log = SecurityAuditLog(
        operator_id=operator_id,
        action_source=action_source,
        action_type=action_type,
        payload=payload
    )
    session.add(log)
    await session.flush()
    return log


@router.post("/logs")
async def create_audit_log(
    req: AuditLogRequest,
    session: AsyncSession = Depends(get_session)
) -> dict:
    log = await log_action(
        session=session,
        action_source=req.action_source,
        action_type=req.action_type,
        payload=req.payload
    )
    await session.commit()
    return {
        "id": log.id if log.id is not None else 1,
        "timestamp": (log.timestamp or datetime.now()).isoformat(),
        "operator_id": log.operator_id,
        "action_source": log.action_source,
        "action_type": log.action_type,
        "payload": log.payload
    }


@router.get("/logs")
async def get_audit_logs(
    session: AsyncSession = Depends(get_session)
) -> list[dict]:
    result = await session.execute(
        select(SecurityAuditLog).order_by(SecurityAuditLog.timestamp.desc())
    )
    logs = result.scalars().all()
    return [
        {
            "id": log.id,
            "timestamp": log.timestamp.isoformat(),
            "operator_id": log.operator_id,
            "action_source": log.action_source,
            "action_type": log.action_type,
            "payload": log.payload
        }
        for log in logs
    ]
