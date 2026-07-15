import { useState, useEffect } from "react";

interface SimulationResult {
  id: number;
  scenario_id: string;
  capacity_available_pct: number;
  run_at: string;
  projected_import_volume_change_pct: number;
  projected_spr_days_cover: number;
  narrative_text: string;
}

export function Simulator() {
  const [sliderValue, setSliderValue] = useState<number>(100);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Trigger simulation computation whenever the slider changes
  useEffect(() => {
    setSimulating(true);
    const triggerSim = setTimeout(() => {
      fetch("/api/scenario/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario_id: "hormuz_partial_closure",
          capacity_available_pct: sliderValue,
        }),
      })
        .then((res) => {
          if (!res.ok) throw new Error("Simulation endpoint error");
          return res.json();
        })
        .then((data) => {
          setResult(data);
          setError(null);
          setSimulating(false);
        })
        .catch((err) => {
          setError(err.message);
          setSimulating(false);
        });
    }, 250); // debounce input slider movements (HLD/LLD §2.11)

    return () => clearTimeout(triggerSim);
  }, [sliderValue]);

  const getCapacityColor = (val: number) => {
    if (val < 30) return "#ef4444"; // high danger
    if (val < 70) return "#f59e0b"; // warning
    return "#10b981"; // safe
  };

  return (
    <div className="simulator-view" style={{ padding: "32px", height: "100%", overflowY: "auto" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <div>
          <h2 className="eyebrow" style={{ color: "#38bdf8", margin: 0 }}>Simulation Engine</h2>
          <h1 style={{ fontSize: "2rem", margin: "4px 0 20px" }}>Strategic Reserve & Flow Simulator</h1>
          <p className="lede" style={{ color: "#8b949e", marginBottom: "32px" }}>
            Model a supply chain crisis along the Strait of Hormuz. Adjust the capacity slider to simulate blockades or shipping route disruptions, observing cascading effects on crude import shortfalls and strategic reserve drawdowns.
          </p>
        </div>

        {/* Simulator Controls & Slider */}
        <div
          className="detail-card"
          style={{
            background: "#161b22",
            border: "1px solid #21262d",
            borderRadius: "12px",
            padding: "24px",
            marginBottom: "24px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <span style={{ fontSize: "1rem", fontWeight: 600, color: "#f1f5f9" }}>
              Strait of Hormuz Available Capacity
            </span>
            <span
              style={{
                fontSize: "1.75rem",
                fontWeight: 800,
                color: getCapacityColor(sliderValue),
                textShadow: `0 0 10px ${getCapacityColor(sliderValue)}33`,
              }}
            >
              {sliderValue}%
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={sliderValue}
            aria-label="Corridor Capacity Available"
            onChange={(e) => setSliderValue(parseInt(e.target.value))}
            style={{
              width: "100%",
              height: "8px",
              background: "#21262d",
              borderRadius: "4px",
              outline: "none",
              cursor: "pointer",
              accentColor: getCapacityColor(sliderValue),
            }}
          />

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "#8b949e", marginTop: "8px" }}>
            <span>0% (Full Closure)</span>
            <span>30% (Worst Historical Closure)</span>
            <span>100% (Normal Operations)</span>
          </div>
        </div>

        {error && (
          <div className="error-panel" style={{ marginBottom: "24px" }}>
            <h3>Simulator Error</h3>
            <p>{error}</p>
          </div>
        )}

        {/* Results Panel */}
        {result && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Calibration Warning block */}
            <div
              style={{
                background: "rgba(245, 158, 11, 0.1)",
                border: "1px solid rgba(245, 158, 11, 0.2)",
                borderRadius: "8px",
                padding: "12px 16px",
                fontSize: "0.82rem",
                color: "#f59e0b",
                lineHeight: "1.4",
              }}
            >
              ⚠️ <strong>Calibration Warning:</strong> This simulation uses a two-point linear interpolation based on historical benchmarks. Note that two real data points do not make a validated curve.
            </div>

            {/* Metrics grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              {/* Metric 1: Import decline */}
              <div
                className="detail-card"
                style={{
                  background: "#161b22",
                  border: "1px solid #21262d",
                  borderRadius: "12px",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <span style={{ fontSize: "0.85rem", color: "#8b949e", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Projected Crude Import Loss
                  </span>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "12px" }}>
                    <strong style={{ fontSize: "2.5rem", color: result.projected_import_volume_change_pct < 0 ? "#ef4444" : "#f1f5f9" }}>
                      {result.projected_import_volume_change_pct.toFixed(1)}%
                    </strong>
                  </div>
                </div>
                <div style={{ fontSize: "0.8rem", color: "#8b949e", marginTop: "16px", borderTop: "1px solid #21262d", paddingTop: "12px" }}>
                  Baseline: 100% supply capacity | Anchor: -23.0% drop at 30% available capacity.
                </div>
              </div>

              {/* Metric 2: SPR Days Cover remaining */}
              <div
                className="detail-card"
                style={{
                  background: "#161b22",
                  border: "1px solid #21262d",
                  borderRadius: "12px",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <span style={{ fontSize: "0.85rem", color: "#8b949e", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Remaining Strategic Reserves Cover
                  </span>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "12px" }}>
                    <strong style={{ fontSize: "2.5rem", color: result.projected_spr_days_cover < 3.0 ? "#ef4444" : result.projected_spr_days_cover < 7.0 ? "#f59e0b" : "#10b981" }}>
                      {result.projected_spr_days_cover.toFixed(1)}
                    </strong>
                    <span style={{ fontSize: "1rem", color: "#8b949e" }}>days</span>
                  </div>
                </div>
                <div style={{ fontSize: "0.8rem", color: "#8b949e", marginTop: "16px", borderTop: "1px solid #21262d", paddingTop: "12px" }}>
                  Baseline starting reserve: ~9.5 days net import cover | Window: 30-day disruption.
                </div>
              </div>
            </div>

            {/* Narrative Box */}
            <div
              className="detail-card"
              style={{
                background: "#0d1117",
                border: "1px solid #21262d",
                borderRadius: "12px",
                padding: "20px",
              }}
            >
              <h3 style={{ color: "#38bdf8", marginBottom: "8px", fontSize: "0.95rem" }}>
                Simulation Impact Narrative
              </h3>
              <p style={{ margin: 0, fontSize: "0.95rem", lineHeight: "1.6", color: "#c9d1d9" }}>
                {simulating ? "Re-simulating cascades..." : result.narrative_text}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
