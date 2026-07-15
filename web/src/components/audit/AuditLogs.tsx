import React, { useEffect, useState } from "react";
import { SettingsIcon, RiskIcon, SpriteIcon, SimulatorIcon } from "../icons/Iconsax";

interface AuditLog {
  id: number;
  timestamp: string;
  operator_id: string;
  action_source: string;
  action_type: string;
  payload: Record<string, any>;
}

export function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const resp = await fetch("/api/audit/logs");
      if (resp.ok) {
        const data = await resp.json();
        setLogs(data);
      }
    } catch (e) {
      console.error("Failed to fetch security audit logs", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // Poll every 3 seconds for live updates in demo
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, []);

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "dashboard_weight_adjustment":
        return <SettingsIcon size={16} color="#38bdf8" />;
      case "scenario_run":
        return <SimulatorIcon size={16} color="#a855f7" />;
      case "reserve_calculation":
        return <SpriteIcon size={16} color="#10b981" />;
      default:
        return <RiskIcon size={16} color="#f59e0b" />;
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case "dashboard_weight_adjustment":
        return "Weight Adjustment";
      case "scenario_run":
        return "Disruption Simulation";
      case "reserve_calculation":
        return "Reserve Drawdown Model";
      default:
        return source.replace(/_/g, " ");
    }
  };

  return (
    <div
      className="detail-card"
      style={{
        background: "rgba(11, 15, 25, 0.6)",
        border: "1px solid rgba(56, 189, 248, 0.15)",
        borderRadius: "12px",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        boxSizing: "border-box"
      }}
    >
      <div style={{ borderBottom: "1px solid #1e293b", paddingBottom: "10px", marginBottom: "12px" }}>
        <h3 style={{ fontSize: "0.85rem", color: "#38bdf8", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
          Security Audit Trail
        </h3>
        <p style={{ fontSize: "0.75rem", color: "#64748b", margin: "4px 0 0" }}>
          ℹ️ Operator tracking operates under a fixed demonstration context (<code>IND-2026-OPS</code>). Real multi-user authentication is simulated for prototype validation.
        </p>
      </div>

      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
        {loading && logs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px", color: "#64748b", fontSize: "0.85rem" }}>
            Loading audit timeline...
          </div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px", color: "#64748b", fontSize: "0.85rem" }}>
            No security audit actions logged.
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              style={{
                background: "#0d1117",
                border: "1px solid #21262d",
                borderRadius: "8px",
                padding: "12px",
                fontSize: "0.8rem",
                display: "flex",
                flexDirection: "column",
                gap: "6px"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 700, color: "#f8fafc" }}>
                  {getSourceIcon(log.action_source)}
                  <span>{getSourceLabel(log.action_source)}</span>
                </div>
                <span style={{ fontSize: "0.7rem", color: "#64748b" }}>
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>

              <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                Operator: <span style={{ color: "#38bdf8", fontFamily: "monospace" }}>{log.operator_id}</span>
              </div>

              <div
                style={{
                  background: "rgba(0,0,0,0.3)",
                  padding: "6px 10px",
                  borderRadius: "4px",
                  border: "1px dashed rgba(255,255,255,0.03)",
                  fontFamily: "monospace",
                  fontSize: "0.7rem",
                  color: "#a7f3d0",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all"
                }}
              >
                {JSON.stringify(log.payload, null, 2)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
