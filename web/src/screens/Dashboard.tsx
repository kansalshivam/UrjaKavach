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

export function Dashboard() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCorridor, setSelectedCorridor] = useState<string>("hormuz");

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
  };

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
          const color = getRiskColor(scoreData.score);
          return (
            <div
              key={scoreData.corridor}
              className={`status-card cursor-pointer transition ${isActive ? "active-glow" : ""}`}
              style={{
                cursor: "pointer",
                border: isActive ? `1px solid ${color}` : "1px solid #21262d",
                boxShadow: isActive ? `0 0 12px ${color}22` : "none",
                background: "#161b22",
                borderRadius: "8px",
                padding: "16px",
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
                  {scoreData.score.toFixed(1)}
                </strong>
                <span style={{ fontSize: "0.8rem", color: "#8b949e" }}>/ 100</span>
              </div>
              <div style={{ marginTop: "12px", fontSize: "0.78rem", color: "#8b949e" }}>
                Signals: GDELT, Price, AIS, OFAC
              </div>
            </div>
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
                weight={data.weights_used.gdelt_volume}
                color="#38bdf8"
              />
              <ComponentBar
                label="Brent Oil Price Volatility"
                value={selectedScore.component_price_volatility}
                weight={data.weights_used.price_volatility}
                color="#f59e0b"
              />
              <ComponentBar
                label="AIS Shipping Deviations"
                value={selectedScore.component_ais_deviation}
                weight={data.weights_used.ais_deviation}
                color="#0ea5e9"
              />
              <ComponentBar
                label="OFAC Sanctions Events"
                value={selectedScore.component_sanctions_flag}
                weight={data.weights_used.sanctions_flag}
                color="#ec4899"
              />
            </div>
          </div>

          {/* Historical Trend Chart */}
          <div className="detail-card" style={{ height: "300px" }}>
            <h3>Geopolitical Risk Trends</h3>
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
                    stroke={getRiskColor(selectedScore.score)}
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
          <div className="detail-card" style={{ display: "flex", flexDirection: "column", height: "450px" }}>
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
                      <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 500, lineLine: "1.4" }}>
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

          {/* Assumptions weights panel */}
          <div className="detail-card">
            <h3>Explainable Model Specifications</h3>
            <div style={{ fontSize: "0.85rem", color: "#8b949e", lineHeight: "1.5", marginTop: "8px" }}>
              <p style={{ margin: "0 0 10px" }}>
                Urja Kavach computes corridor risk using a transparent, explainable 4-term formula summing to 100%:
              </p>
              <div style={{ background: "#0d1117", padding: "10px", borderRadius: "6px", border: "1px solid #21262d", fontFamily: "monospace", fontSize: "0.78rem" }}>
                Risk = (0.35 * GDELT) + (0.25 * Brent Price) + (0.30 * AIS Deviation) + (0.10 * Sanctions)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ComponentBar({
  label,
  value,
  weight,
  color,
}: {
  label: string;
  value: number;
  weight: number;
  color: string;
}) {
  const percentContribution = value * weight * 100;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginBottom: "4px" }}>
        <span style={{ color: "#c9d1d9" }}>{label}</span>
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
