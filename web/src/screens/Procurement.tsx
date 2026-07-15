// HONEST LABEL: Custom premium UI screen for Adaptive Procurement Recommendations.
// Visualizes rule-based ranked alternatives based on dynamic suitability metrics and benchmarks against actual 2026 data.
import React, { useEffect, useState } from "react";

interface Recommendation {
  rank: number;
  country: string;
  grade: string;
  quality_compatibility: string;
  transit_days: number;
  cost_premium: string;
  suitability_score: number;
  actual_2026_role: string;
}

export function Procurement() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [capacity, setCapacity] = useState(50.0); // Simulated slider state for previewing adjustments

  const fetchRecommendations = async (val: number) => {
    try {
      const resp = await fetch(`/api/procurement/recommendations?capacity_available_pct=${val}`);
      if (resp.ok) {
        const data = await resp.json();
        setRecommendations(data);
      }
    } catch (e) {
      console.error("Failed to fetch procurement recommendations", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations(capacity);
  }, [capacity]);

  return (
    <div style={{ padding: "24px", color: "#e2e8f0", fontFamily: "system-ui, sans-serif" }}>
      {/* Header section with benchmark information */}
      <div
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          border: "1px solid #334155",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "24px",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <span style={{ fontSize: "0.75rem", background: "rgba(56, 189, 248, 0.1)", color: "#38bdf8", padding: "4px 10px", borderRadius: "9999px", fontWeight: 600 }}>
              Adaptive Sourcing Ranker
            </span>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, margin: "8px 0 4px", color: "#f8fafc" }}>
              Procurement Diversification recommendations
            </h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "rgba(0,0,0,0.2)", padding: "10px 16px", borderRadius: "8px", border: "1px solid #334155" }}>
            <label style={{ fontSize: "0.85rem", color: "#94a3b8" }}>Simulated Corridor Capacity:</label>
            <input
              type="range"
              min="0"
              max="100"
              value={capacity}
              onChange={(e) => setCapacity(parseFloat(e.target.value))}
              style={{ accentColor: "#38bdf8", cursor: "pointer" }}
            />
            <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#38bdf8", width: "45px", textAlign: "right" }}>
              {capacity.toFixed(0)}%
            </span>
          </div>
        </div>

        <div
          style={{
            borderLeft: "4px solid #f59e0b",
            background: "rgba(245, 158, 11, 0.05)",
            padding: "16px",
            borderRadius: "0 8px 8px 0",
            fontSize: "0.9rem",
            lineHeight: "1.5",
            color: "#cbd5e1",
          }}
        >
          <strong style={{ color: "#f59e0b", display: "block", marginBottom: "4px" }}>
            2026 Crisis Benchmark Alignment
          </strong>
          During the worst weeks of the 2026 disruption, India's refiners pivoted to non-Hormuz sourcing, raising its import share from <strong>~55% to ~70%</strong> within weeks by drawing heavily from West Africa, the Americas, and Russia.
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>Loading recommendations...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {recommendations.map((rec) => (
            <div
              key={rec.rank}
              style={{
                background: "#0b0f19",
                border: "1px solid #1e293b",
                borderRadius: "12px",
                padding: "20px",
                display: "grid",
                gridTemplateColumns: "60px 1fr 180px 180px 120px",
                alignItems: "center",
                gap: "20px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.2)",
                transition: "all 0.2s ease-in-out",
              }}
            >
              {/* Rank column */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: rec.rank === 1 ? "rgba(16, 185, 129, 0.15)" : "rgba(30, 41, 59, 0.5)",
                    border: `1px solid ${rec.rank === 1 ? "#10b981" : "#334155"}`,
                    color: rec.rank === 1 ? "#10b981" : "#f1f5f9",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  #{rec.rank}
                </span>
              </div>

              {/* Supplier Info */}
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 4px", color: "#f1f5f9" }}>
                  {rec.country}
                </h3>
                <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Grade: {rec.grade}</span>
              </div>

              {/* Details Metrics */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Transit Metrics</span>
                <span style={{ fontSize: "0.9rem", color: "#cbd5e1" }}>
                  {rec.transit_days} days | {rec.cost_premium}
                </span>
              </div>

              {/* Compatibility */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Quality Compatibility</span>
                <span
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    color: rec.quality_compatibility === "High" ? "#10b981" : "#f59e0b",
                  }}
                >
                  {rec.quality_compatibility}
                </span>
              </div>

              {/* Suitability Score */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Suitability</span>
                <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "#38bdf8" }}>
                  {rec.suitability_score}%
                </span>
              </div>

              {/* Actual 2026 role (spans across columns below) */}
              <div
                style={{
                  gridColumn: "2 / -1",
                  borderTop: "1px solid rgba(255,255,255,0.05)",
                  paddingTop: "12px",
                  marginTop: "12px",
                  fontSize: "0.8rem",
                  color: "#94a3b8",
                  lineHeight: "1.4",
                }}
              >
                <strong style={{ color: "#38bdf8" }}>2026 Ground Truth:</strong> {rec.actual_2026_role}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
