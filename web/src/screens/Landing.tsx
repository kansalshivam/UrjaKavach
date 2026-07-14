import { useState } from "react";

interface LandingProps {
  onLogin: () => void;
}

export function Landing({ onLogin }: LandingProps) {
  const [operatorId, setOperatorId] = useState("IND-2026-OPS");
  const [password, setPassword] = useState("••••••••");
  const [error, setError] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!operatorId || !password) {
      setError("Please fill in all security authorization fields.");
      return;
    }
    onLogin();
  };

  return (
    <div
      className="landing-view"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        width: "100vw",
        background: "radial-gradient(circle at center, #0f172a 0%, #020617 100%)",
        color: "#e2e8f0",
        fontFamily: "system-ui, sans-serif",
        padding: "20px",
        overflowY: "auto",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: "800px", width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", alignItems: "center" }}>
        
        {/* LEFT COLUMN: Framing & Crisis Timeline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <span style={{ fontSize: "0.75rem", background: "rgba(56, 189, 248, 0.1)", color: "#38bdf8", padding: "4px 10px", borderRadius: "9999px", fontWeight: 600, border: "1px solid rgba(56, 189, 248, 0.2)" }}>
              Ministry Control-Room View — Prototype
            </span>
            <h1 style={{ fontSize: "2.25rem", fontWeight: 800, color: "#f1f5f9", margin: "16px 0 8px" }}>
              Urja Kavach
            </h1>
            <p style={{ fontSize: "0.95rem", color: "#94a3b8", margin: 0, lineHeight: "1.5" }}>
              AI-Driven Energy Supply Chain Resilience Operations console for import-dependent economies.
            </p>
          </div>

          {/* Timeline story block of the 2026 crisis */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", borderLeft: "2px solid #1e293b", paddingLeft: "16px", marginTop: "10px" }}>
            <h3 style={{ fontSize: "0.85rem", textTransform: "uppercase", color: "#64748b", letterSpacing: "0.05em", margin: "0 0 4px" }}>
              2026 Crisis Timeline Tracker
            </h3>
            
            <div style={{ fontSize: "0.85rem" }}>
              <strong style={{ color: "#38bdf8" }}>July 6, 2026</strong>
              <p style={{ margin: "2px 0 0", color: "#94a3b8" }}>Brent crude prices surge to $69.56/bbl as geopolitical tensions rise in the Middle East.</p>
            </div>

            <div style={{ fontSize: "0.85rem" }}>
              <strong style={{ color: "#f59e0b" }}>July 10, 2026</strong>
              <p style={{ margin: "2px 0 0", color: "#94a3b8" }}>OFAC database lists new entity restrictions; naval blockades threatened around key trade routes.</p>
            </div>

            <div style={{ fontSize: "0.85rem" }}>
              <strong style={{ color: "#ef4444" }}>July 14, 2026</strong>
              <p style={{ margin: "2px 0 0", color: "#94a3b8" }}>Strait of Hormuz transit capacity drops. Ingestion scheduler triggers live risk recalculation alert.</p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Demo Login Form */}
        <div
          className="detail-card"
          style={{
            background: "#0b0f19",
            border: "1px solid #1e293b",
            borderRadius: "12px",
            padding: "32px",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 15px rgba(56, 189, 248, 0.1)",
          }}
        >
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0 0 6px", color: "#f1f5f9" }}>
            Operator Authentication
          </h2>
          <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "0 0 24px" }}>
            Enter credential tokens to access the crisis control room.
          </p>

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 500 }}>Operator ID</label>
              <input
                type="text"
                value={operatorId}
                onChange={(e) => setOperatorId(e.target.value)}
                style={{
                  background: "#030712",
                  border: "1px solid #1e293b",
                  borderRadius: "6px",
                  padding: "10px",
                  color: "#f1f5f9",
                  outline: "none",
                  fontSize: "0.9rem",
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 500 }}>Security Passcode</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  background: "#030712",
                  border: "1px solid #1e293b",
                  borderRadius: "6px",
                  padding: "10px",
                  color: "#f1f5f9",
                  outline: "none",
                  fontSize: "0.9rem",
                }}
              />
            </div>

            {error && (
              <p style={{ fontSize: "0.8rem", color: "#ef4444", margin: 0 }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              style={{
                background: "#0284c7",
                border: "none",
                borderRadius: "6px",
                padding: "12px",
                color: "#ffffff",
                fontWeight: 600,
                cursor: "pointer",
                transition: "background 0.2s",
                marginTop: "8px",
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = "#0369a1")}
              onMouseOut={(e) => (e.currentTarget.style.background = "#0284c7")}
            >
              Authorized Access Only
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
