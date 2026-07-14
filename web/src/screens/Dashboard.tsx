import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { CursorCard } from "../components/cards/CursorCard";
import { Checkbox } from "../components/animate/Checkbox";
import { SettingsIcon, RiskIcon } from "../components/icons/Iconsax";

interface RiskScoreData {
  id: number;
  corridor: string;
  computed_at: string;
  score: number;
  component_gdelt_volume: number;
  component_price_volatility: number;
  component_ais_deviation: number;
  component_sanctions_flag: number;
  weights_used: { [key: string]: number };
  component_gdelt_stale?: boolean;
  component_price_stale?: boolean;
  component_ais_stale?: boolean;
  component_sanctions_stale?: boolean;
}

interface HistoryItem {
  corridor: string;
  computed_at: string;
  score: number;
}

interface ArticleItem {
  id: number;
  corridor: string;
  title: string;
  url: string;
  seendate: string;
  domain: string;
}

interface DashboardSummary {
  risk_scores: RiskScoreData[];
  history: HistoryItem[];
  recent_articles: ArticleItem[];
  weights_used: { [key: string]: number };
}

interface DashboardProps {
  weights: {
    gdelt_volume: number;
    price_volatility: number;
    ais_deviation: number;
    sanctions_flag: number;
  };
  setWeights: React.Dispatch<React.SetStateAction<{
    gdelt_volume: number;
    price_volatility: number;
    ais_deviation: number;
    sanctions_flag: number;
  }>>;
  setCustomNodeRisks: (risks: Record<string, number> | null) => void;
}

export function Dashboard({ weights, setWeights, setCustomNodeRisks }: DashboardProps) {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCorridor, setSelectedCorridor] = useState<string>("hormuz");
  const [outOfScopeStates, setOutOfScopeStates] = useState({ pattern: true, routing: false, spr: false });

  // Recompute node risks on weight changes (Part 3 Fix)
  useEffect(() => {
    const triggerRecompute = setTimeout(() => {
      fetch("/api/twin/recompute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(weights),
      })
        .then((res) => {
          if (!res.ok) throw new Error("Recompute failed");
          return res.json();
        })
        .then((data) => {
          setCustomNodeRisks(data.node_risks);
        })
        .catch((err) => console.error("Recompute node risks error:", err));
    }, 250); // Debounce to avoid API hammering

    return () => clearTimeout(triggerRecompute);
  }, [weights]);

  // Fetch dashboard summary data
  useEffect(() => {
    const fetchData = () => {
      fetch("/api/dashboard/summary")
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch dashboard summary");
          return res.json();
        })
        .then((summary) => {
          setData(summary);
          // Set initial weights from DB if present
          if (summary.weights_used) {
            setWeights({
              gdelt_volume: summary.weights_used.gdelt_volume ?? 0.35,
              price_volatility: summary.weights_used.price_volatility ?? 0.25,
              ais_deviation: summary.weights_used.ais_deviation ?? 0.30,
              sanctions_flag: summary.weights_used.sanctions_flag ?? 0.10,
            });
          }
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message);
          setLoading(false);
        });
    };

    fetchData();
    const interval = setInterval(fetchData, 60000); // Poll every 60s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "32px", color: "#94a3b8" }}>
        <p>Loading operations dashboard data...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="error-panel" style={{ margin: "32px" }}>
        <h3>Dashboard Connection Error</h3>
        <p>{error || "No data received from API"}</p>
      </div>
    );
  }

  const getCorridorLabel = (key: string) => {
    switch (key) {
      case "hormuz":
        return "Strait of Hormuz";
      case "non_hormuz_west_africa":
        return "West Africa Corridor";
      case "non_hormuz_americas":
        return "Americas Corridor";
      case "non_hormuz_russia":
        return "Russia Route";
      default:
        return key;
    }
  };

  const getRiskColor = (score: number) => {
    if (score > 50) return "#ef4444"; // Red
    if (score > 25) return "#f59e0b"; // Amber
    return "#10b981"; // Emerald
  };

  const selectedScore = data.risk_scores.find(
    (s) => s.corridor === selectedCorridor
  ) || {
    score: 0,
    component_gdelt_volume: 0,
    component_price_volatility: 0,
    component_ais_deviation: 0,
    component_sanctions_flag: 0,
    component_gdelt_stale: false,
    component_price_stale: false,
    component_ais_stale: false,
    component_sanctions_stale: false,
  };

  // Helper to dynamically calculate score based on active weights
  const calculateDynamicScore = (scoreData: any) => {
    const rawVal =
      weights.gdelt_volume * (scoreData.component_gdelt_volume || 0) +
      weights.price_volatility * (scoreData.component_price_volatility || 0) +
      weights.ais_deviation * (scoreData.component_ais_deviation || 0) +
      weights.sanctions_flag * (scoreData.component_sanctions_flag || 0);
    return Math.min(100.0, Math.max(0.0, rawVal * 100));
  };

  const dynamicSelectedScore = calculateDynamicScore(selectedScore);

  // Format history data for Chart (group by timestamp)
  const timestamps = Array.from(new Set(data.history.map((h) => h.computed_at))).sort();
  const chartData = timestamps.map((ts) => {
    const item: any = {
      name: new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    data.history.forEach((h) => {
      if (h.computed_at === ts) {
        item[getCorridorLabel(h.corridor)] = parseFloat(h.score.toFixed(1));
      }
    });
    return item;
  });

  const weightsSum = parseFloat(
    (weights.gdelt_volume + weights.price_volatility + weights.ais_deviation + weights.sanctions_flag).toFixed(2)
  );

  return (
    <div className="dashboard-view" style={{ padding: "24px", height: "100%", overflowY: "auto" }}>
      <div style={{ display: "flex", justifyContent: "between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h2 className="eyebrow" style={{ color: "#38bdf8", margin: 0 }}>Operations Room</h2>
          <h1 style={{ fontSize: "1.75rem", margin: "4px 0 0" }}>Geopolitical Risk Briefing</h1>
        </div>
      </div>

      {/* Corridor Cards Grid */}
      <div className="grid-layout" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        {data.risk_scores.map((scoreData) => {
          const isActive = scoreData.corridor === selectedCorridor;
          const dynamicScore = calculateDynamicScore(scoreData);
          const color = getRiskColor(dynamicScore);
          const glowColor = color === "#ef4444" ? "rgba(239, 68, 68, 0.12)" : color === "#f59e0b" ? "rgba(245, 158, 11, 0.12)" : "rgba(16, 185, 129, 0.12)";
          return (
            <CursorCard
              key={scoreData.corridor}
              glowColor={glowColor}
              style={{
                border: isActive ? `1.5px solid ${color}` : "1px solid #21262d",
                boxShadow: isActive ? `0 0 12px ${color}22` : "none",
              }}
              onClick={() => setSelectedCorridor(scoreData.corridor)}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "12px" }}>
                <span style={{ fontSize: "0.85rem", color: "#8b949e", fontWeight: 500 }}>
                  {getCorridorLabel(scoreData.corridor)}
                </span>
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: color,
                    boxShadow: `0 0 6px ${color}`,
                  }}
                />
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                <strong style={{ fontSize: "2rem", color: "#f1f5f9" }}>
                  {dynamicScore.toFixed(1)}
                </strong>
                <span style={{ fontSize: "0.8rem", color: "#8b949e" }}>/ 100</span>
              </div>
              <div style={{ marginTop: "12px", fontSize: "0.78rem", color: "#8b949e" }}>
                Signals: GDELT, Price, AIS, OFAC
              </div>
            </CursorCard>
          );
        })}
      </div>

      <div className="content-panel" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {/* LEFT COLUMN: Risk Trend and Signals Breakdown */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Component breakdown of selected corridor */}
          <div className="detail-card">
            <h3>Signal Weight Contributions ({getCorridorLabel(selectedCorridor)})</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
              <ComponentBar
                label="GDELT News Volume"
                value={selectedScore.component_gdelt_volume}
                weight={weights.gdelt_volume}
                color="#38bdf8"
                stale={selectedScore.component_gdelt_stale}
              />
              <ComponentBar
                label="Brent Oil Price Volatility"
                value={selectedScore.component_price_volatility}
                weight={weights.price_volatility}
                color="#f59e0b"
                stale={selectedScore.component_price_stale}
              />
              <ComponentBar
                label="AIS Shipping Deviations"
                value={selectedScore.component_ais_deviation}
                weight={weights.ais_deviation}
                color="#0ea5e9"
                stale={selectedScore.component_ais_stale}
              />
              <ComponentBar
                label="OFAC Sanctions Events"
                value={selectedScore.component_sanctions_flag}
                weight={weights.sanctions_flag}
                color="#ec4899"
                stale={selectedScore.component_sanctions_stale}
              />
            </div>
          </div>

          {/* Historical Trend Chart */}
          <div className="detail-card" style={{ height: "300px" }}>
            <h3>Geopolitical Risk Trends (Baseline)</h3>
            <div style={{ width: "100%", height: "90%", marginTop: "12px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                  <XAxis dataKey="name" stroke="#8b949e" fontSize={11} />
                  <YAxis stroke="#8b949e" fontSize={11} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      background: "#161b22",
                      border: "1px solid #30363d",
                      color: "#c9d1d9",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", color: "#8b949e" }} />
                  <Line
                    type="monotone"
                    dataKey={getCorridorLabel(selectedCorridor)}
                    stroke={getRiskColor(dynamicSelectedScore)}
                    strokeWidth={2.5}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: GDELT News Feed & Assumptions Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* GDELT Signal feed */}
          <div className="detail-card" style={{ display: "flex", flexDirection: "column", height: "300px" }}>
            <h3>Geopolitical Signal Feed</h3>
            <div style={{ overflowY: "auto", flex: 1, marginTop: "12px" }}>
              {data.recent_articles.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {data.recent_articles.map((art) => (
                    <a
                      key={art.id}
                      href={art.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="feed-item"
                      style={{
                        display: "block",
                        padding: "10px",
                        background: "#0d1117",
                        border: "1px solid #21262d",
                        borderRadius: "6px",
                        textDecoration: "none",
                        color: "#c9d1d9",
                        transition: "border 0.2s",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#8b949e", marginBottom: "4px" }}>
                        <span style={{ textTransform: "uppercase", color: "#38bdf8", fontWeight: 600 }}>
                          {art.domain}
                        </span>
                        <span>{getCorridorLabel(art.corridor)}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 500, lineHeight: "1.4" }}>
                        {art.title}
                      </p>
                    </a>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: "0.9rem", color: "#8b949e" }}>No recent geopolitical articles in database.</p>
              )}
            </div>
          </div>

          {/* Assumptions weights panel & Out-of-Scope lists (Phase 10) */}
          <div className="detail-card">
            <h3>Explainable Model Specifications</h3>

            {/* Calibration Warning block */}
            <div
              style={{
                background: "rgba(245, 158, 11, 0.1)",
                border: "1px solid rgba(245, 158, 11, 0.15)",
                borderRadius: "6px",
                padding: "10px",
                fontSize: "0.76rem",
                color: "#f59e0b",
                lineHeight: "1.4",
                marginTop: "10px",
              }}
            >
              ⚠️ <strong>Calibration Notice:</strong> Scenario simulations use a two-point linear interpolation based on historical benchmarks. Note that two real data points do not make a validated curve.
            </div>
            
            {/* Interactive sliders for weights */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px", borderBottom: "1px solid #21262d", paddingBottom: "16px" }}>
              <span style={{ fontSize: "0.8rem", color: "#f1f5f9", fontWeight: 600 }}>Adjust Weight Constants:</span>
              
              <SliderInput
                label="GDELT News Volume"
                val={weights.gdelt_volume}
                onChange={(v) => setWeights({ ...weights, gdelt_volume: v })}
              />
              <SliderInput
                label="Brent Oil Price Volatility"
                val={weights.price_volatility}
                onChange={(v) => setWeights({ ...weights, price_volatility: v })}
              />
              <SliderInput
                label="AIS Shipping Deviations"
                val={weights.ais_deviation}
                onChange={(v) => setWeights({ ...weights, ais_deviation: v })}
              />
              <SliderInput
                label="OFAC Sanctions"
                val={weights.sanctions_flag}
                onChange={(v) => setWeights({ ...weights, sanctions_flag: v })}
              />

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginTop: "4px" }}>
                <span>Sum of Weights:</span>
                <strong style={{ color: weightsSum === 1.0 ? "#10b981" : "#ef4444" }}>
                  {weightsSum.toFixed(2)} {weightsSum !== 1.0 && "⚠️ (Must equal 1.00)"}
                </strong>
              </div>
            </div>

            {/* Out of Scope parameters */}
            <div style={{ marginTop: "14px", borderTop: "1px solid #21262d", paddingTop: "14px" }}>
              <span style={{ fontSize: "0.8rem", color: "#8b949e", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "8px" }}>
                Explicitly Out of Scope
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "6px" }}>
                <Checkbox
                  id="checkbox-pattern"
                  checked={outOfScopeStates.pattern}
                  onCheckedChange={(checked) => setOutOfScopeStates({ ...outOfScopeStates, pattern: checked })}
                  label="Historical pattern matching (pre-2026 baseline logic error)"
                />
                <Checkbox
                  id="checkbox-routing"
                  checked={outOfScopeStates.routing}
                  onCheckedChange={(checked) => setOutOfScopeStates({ ...outOfScopeStates, routing: checked })}
                  label="Advanced routing optimization layer"
                />
                <Checkbox
                  id="checkbox-spr"
                  checked={outOfScopeStates.spr}
                  onCheckedChange={(checked) => setOutOfScopeStates({ ...outOfScopeStates, spr: checked })}
                  label="Strategic Petroleum Reserve (SPR) procurement execution layer"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface SliderProps {
  label: string;
  val: number;
  onChange: (v: number) => void;
}

function SliderInput({ label, val, onChange }: SliderProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#8b949e" }}>
        <span>{label}</span>
        <strong>{val.toFixed(2)}</strong>
      </div>
      <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={val}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: "100%", accentColor: "#38bdf8", cursor: "pointer" }}
      />
    </div>
  );
}

function ComponentBar({
  label,
  value,
  weight,
  color,
  stale,
}: {
  label: string;
  value: number;
  weight: number;
  color: string;
  stale?: boolean;
}) {
  const percentContribution = value * weight * 100;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginBottom: "4px" }}>
        <span style={{ color: stale ? "#ef4444" : "#c9d1d9" }}>
          {label} {stale && <span style={{ color: "#ef4444", fontSize: "0.75rem", background: "rgba(239, 68, 68, 0.1)", padding: "1px 5px", borderRadius: "3px", marginLeft: "6px" }}>Stale</span>}
        </span>
        <span style={{ color: "#8b949e" }}>
          Signal: {value.toFixed(2)} | Contribution: +{percentContribution.toFixed(1)}%
        </span>
      </div>
      <div style={{ width: "100%", height: "6px", background: "#21262d", borderRadius: "3px", overflow: "hidden" }}>
        <div
          style={{
            width: `${value * 100}%`,
            height: "100%",
            background: color,
            borderRadius: "3px",
            boxShadow: `0 0 4px ${color}`,
          }}
        />
      </div>
    </div>
  );
}
