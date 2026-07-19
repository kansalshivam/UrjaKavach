import { useEffect, useState, useRef } from "react";
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
import { Checkbox } from "../components/animate/Checkbox";
import { HoverVideoPlayer } from "../components/media/HoverVideoPlayer";
import { AuditLogs } from "../components/audit/AuditLogs";
import { GlassCard } from "@/components/ui/GlassCard";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { CustomSlider } from "@/components/ui/CustomSlider";
import { Skeleton } from "@/components/ui/Skeleton";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

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
  last_updated_gdelt?: string;
  last_updated_price?: string;
  last_updated_ais?: string;
  last_updated_sanctions?: string;
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
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!loading && !error) {
      gsap.from(".dashboard-fade-in", {
        y: 20,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: "power2.out",
        clearProps: "all"
      });
    }
  }, [loading, error]);

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
      <div className="p-6 md:p-8 h-full flex flex-col gap-6 w-full max-w-[95%] xl:max-w-[1800px] mx-auto">
        <Skeleton height={80} className="w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Skeleton height={140} />
          <Skeleton height={140} />
          <Skeleton height={140} />
          <Skeleton height={140} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
          <Skeleton className="h-full min-h-[400px]" />
          <Skeleton className="h-full min-h-[400px]" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 w-full max-w-[1400px] mx-auto">
        <GlassCard glowColor="red" className="p-8 w-full" animate={false}>
          <h3 className="text-xl font-bold text-red-400 mb-3">Dashboard Connection Error</h3>
          <p className="text-slate-300 text-base">{error || "No data received from API. Make sure the backend is running."}</p>
        </GlassCard>
      </div>
    );
  }

  const getCorridorLabel = (key: string) => {
    switch (key) {
      case "hormuz": return "Strait of Hormuz";
      case "non_hormuz_west_africa": return "West Africa Corridor";
      case "non_hormuz_americas": return "Americas Corridor";
      case "non_hormuz_russia": return "Russia Route";
      default: return key;
    }
  };

  const getRiskColorEnum = (score: number) => {
    if (score > 50) return "red";
    if (score > 25) return "amber";
    return "green";
  };

  const getRiskColorHex = (score: number) => {
    if (score > 50) return "#ef4444";
    if (score > 25) return "#f59e0b";
    return "#10b981";
  };

  const selectedScore = (data.risk_scores.find(
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
  }) as RiskScoreData;

  const calculateDynamicScore = (scoreData: any) => {
    const rawVal =
      weights.gdelt_volume * (scoreData.component_gdelt_volume || 0) +
      weights.price_volatility * (scoreData.component_price_volatility || 0) +
      weights.ais_deviation * (scoreData.component_ais_deviation || 0) +
      weights.sanctions_flag * (scoreData.component_sanctions_flag || 0);
    return Math.min(100.0, Math.max(0.0, rawVal * 100));
  };

  const dynamicSelectedScore = calculateDynamicScore(selectedScore);

  // Group history by minute to align slightly different timestamps of the same scheduler run
  const historyByMinute: Record<string, Record<string, number>> = {};
  data.history.forEach((h) => {
    const dateObj = new Date(h.computed_at);
    dateObj.setSeconds(0);
    dateObj.setMilliseconds(0);
    const minKey = dateObj.toISOString();
    
    if (!historyByMinute[minKey]) {
      historyByMinute[minKey] = {};
    }
    historyByMinute[minKey][getCorridorLabel(h.corridor)] = parseFloat(h.score.toFixed(1));
  });

  const sortedMinutes = Object.keys(historyByMinute).sort();
  const chartData = sortedMinutes.map((ts) => {
    const dateObj = new Date(ts);
    return {
      name: dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      ...historyByMinute[ts],
    };
  });

  const weightsSum = parseFloat(
    (weights.gdelt_volume + weights.price_volatility + weights.ais_deviation + weights.sanctions_flag).toFixed(2)
  );

  return (
    <div ref={containerRef} className="p-6 md:p-8 max-w-[95%] xl:max-w-[1800px] mx-auto flex flex-col gap-8 w-full">
      <div className="dashboard-fade-in">
        <h2 className="section-header mb-1">Operations Room</h2>
        <h1 className="text-3xl font-bold text-slate-100">Geopolitical Risk Briefing</h1>
      </div>

      {/* Corridor Cards Grid */}
      <div className="dashboard-fade-in grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {data.risk_scores.map((scoreData) => {
          const isActive = scoreData.corridor === selectedCorridor;
          const dynamicScore = calculateDynamicScore(scoreData);
          const colorEnum = getRiskColorEnum(dynamicScore);
          const colorHex = getRiskColorHex(dynamicScore);
          
          return (
            <GlassCard
              key={scoreData.corridor}
              glowColor={colorEnum}
              animate={false}
              className={cn(
                "p-5 cursor-pointer relative overflow-hidden transition-all duration-300",
                isActive && "ring-2 ring-offset-2 ring-offset-slate-950"
              )}
              style={isActive ? { borderColor: colorHex, boxShadow: `0 0 20px ${colorHex}33` } : {}}
            >
              <div 
                className="absolute inset-0 z-0 opacity-0 transition-opacity duration-300"
                style={{ 
                  background: `radial-gradient(400px circle at 50% 50%, ${colorHex}15 0%, transparent 100%)`,
                  opacity: isActive ? 1 : 0
                }}
              />
              <div 
                className="absolute inset-0 z-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{ 
                  background: `radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${colorHex}15 0%, transparent 100%)`
                }}
                onPointerMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
                  e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
                }}
              />
              
              <div 
                className="relative z-10 w-full h-full"
                onClick={() => setSelectedCorridor(scoreData.corridor)}
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="text-sm font-semibold text-slate-400">
                    {getCorridorLabel(scoreData.corridor)}
                  </span>
                  <div className="relative flex items-center justify-center w-3 h-3">
                    {isActive && (
                      <span className="absolute inset-0 rounded-full animate-ping opacity-50" style={{ backgroundColor: colorHex }} />
                    )}
                    <span className="relative w-2 h-2 rounded-full" style={{ backgroundColor: colorHex }} />
                  </div>
                </div>
                
                <div className="flex items-baseline gap-2 mb-3">
                  <AnimatedCounter value={dynamicScore} decimals={1} className="text-4xl" />
                  <span className="text-sm font-medium text-slate-500">/ 100</span>
                </div>
                
                <div className="text-xs text-slate-500 font-medium">
                  Signals: GDELT, Price, AIS, OFAC
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 pb-10 items-start">
        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-8">
          <GlassCard className="dashboard-fade-in p-6" animate={false}>
            <h3 className="card-title mb-6">Signal Weight Contributions ({getCorridorLabel(selectedCorridor)})</h3>
            <div className="flex flex-col gap-5">
              <ComponentBar
                label="GDELT News Volume"
                value={selectedScore.component_gdelt_volume}
                weight={weights.gdelt_volume}
                color="#38bdf8"
                stale={selectedScore.component_gdelt_stale}
                lastUpdated={selectedScore.last_updated_gdelt}
              />
              <ComponentBar
                label="Brent Oil Price Volatility"
                value={selectedScore.component_price_volatility}
                weight={weights.price_volatility}
                color="#f59e0b"
                stale={selectedScore.component_price_stale}
                lastUpdated={selectedScore.last_updated_price}
              />
              <ComponentBar
                label="AIS Shipping Deviations"
                value={selectedScore.component_ais_deviation}
                weight={weights.ais_deviation}
                stale={selectedScore.component_ais_stale}
                lastUpdated={selectedScore.last_updated_ais}
                color="sky"
              />
              <ComponentBar
                label="OFAC Sanctions Events"
                value={selectedScore.component_sanctions_flag}
                weight={weights.sanctions_flag}
                color="#ec4899"
                stale={selectedScore.component_sanctions_stale}
                lastUpdated={selectedScore.last_updated_sanctions}
              />
            </div>
          </GlassCard>

          <GlassCard className="dashboard-fade-in p-6 flex flex-col h-[400px]" animate={false}>
            <h3 className="card-title mb-4">Geopolitical Risk Trends (Baseline)</h3>
            <div className="w-full flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#64748b" fontSize={12} domain={[0, 100]} tickLine={false} axisLine={false} dx={-10} />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(15, 23, 42, 0.9)",
                      backdropFilter: "blur(10px)",
                      border: "1px solid rgba(51, 65, 85, 0.5)",
                      borderRadius: "8px",
                      color: "#f8fafc",
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
                    }}
                    itemStyle={{ fontWeight: 600 }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px", color: "#94a3b8", paddingTop: "20px" }} />
                  <Line
                    type="monotone"
                    dataKey={getCorridorLabel(selectedCorridor)}
                    stroke={getRiskColorHex(dynamicSelectedScore)}
                    strokeWidth={3}
                    activeDot={{ r: 6, fill: getRiskColorHex(dynamicSelectedScore), stroke: "#0f172a", strokeWidth: 2 }}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard className="dashboard-fade-in h-[320px] overflow-y-auto p-0 border-0" animate={false}>
            <AuditLogs />
          </GlassCard>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-8">
          <GlassCard className="dashboard-fade-in p-6 flex flex-col h-[350px]" animate={false}>
            <h3 className="card-title mb-4">Geopolitical Signal Feed</h3>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {data.recent_articles.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {data.recent_articles.map((art) => (
                    <a
                      key={art.id}
                      href={art.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-[140px] rounded-xl overflow-hidden shadow-lg border border-slate-700/50 block relative cursor-pointer group"
                    >
                      <HoverVideoPlayer
                        thumbnailUrl="https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=600&q=80"
                        videoUrl="https://assets.mixkit.co/videos/preview/mixkit-cargo-ship-sailing-in-the-sea-aerial-view-34282-large.mp4"
                        overlayText={`Source: ${art.domain}`}
                        metadata={
                          <div style={{
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            right: 0,
                            background: "linear-gradient(to top, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.7) 70%, transparent 100%)",
                            padding: "12px 16px",
                            textAlign: "left"
                          }}>
                            <p style={{
                              fontSize: "0.85rem",
                              fontWeight: 600,
                              color: "#f8fafc",
                              lineHeight: "1.2rem",
                              margin: "0 0 6px 0",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              textShadow: "1px 1px 3px rgba(0,0,0,0.8)"
                            }}>
                              {art.title}
                            </p>
                            <div style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              width: "100%"
                            }}>
                              <span style={{
                                fontSize: "0.7rem",
                                fontWeight: 700,
                                color: "#38bdf8",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em"
                              }}>
                                {getCorridorLabel(art.corridor)}
                              </span>
                              <span style={{
                                fontSize: "0.7rem",
                                color: "#94a3b8",
                                marginLeft: "auto"
                              }}>
                                {art.domain}
                              </span>
                            </div>
                          </div>
                        }
                      />
                    </a>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500">
                  No recent geopolitical articles in database.
                </div>
              )}
            </div>
          </GlassCard>



          <GlassCard className="dashboard-fade-in p-6" animate={false}>
            <h3 className="card-title mb-1">Explainable Model Specifications</h3>
            
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-6">
              <p className="text-xs text-amber-400 leading-relaxed">
                <strong className="font-bold">⚠️ Calibration Notice:</strong> Scenario simulations use a two-point linear interpolation based on historical benchmarks. Note that two data points do not make a validated curve. Stale signals are excluded from calculation (contribution set to 0.0) under fixed weights, meaning the maximum achievable score is reduced by the weight of any currently-excluded signal.
              </p>
            </div>
            
            <div className="mt-6 flex flex-col gap-2 pb-6 border-b border-slate-700/50">
              <span className="text-sm font-semibold text-slate-200 mb-2">Adjust Weight Constants:</span>
              
              <CustomSlider
                label="GDELT News Volume"
                value={weights.gdelt_volume}
                onChange={(v) => setWeights({ ...weights, gdelt_volume: v })}
                min={0} max={1} step={0.05}
                colorScheme="blue"
              />
              <CustomSlider
                label="Brent Oil Price Volatility"
                value={weights.price_volatility}
                onChange={(v) => setWeights({ ...weights, price_volatility: v })}
                min={0} max={1} step={0.05}
                colorScheme="blue"
              />
              <CustomSlider
                label="AIS Shipping Deviations"
                value={weights.ais_deviation}
                onChange={(v) => setWeights({ ...weights, ais_deviation: v })}
                min={0} max={1} step={0.05}
                colorScheme="blue"
              />
              <CustomSlider
                label="OFAC Sanctions"
                value={weights.sanctions_flag}
                onChange={(v) => setWeights({ ...weights, sanctions_flag: v })}
                min={0} max={1} step={0.05}
                colorScheme="blue"
              />

              <div className="flex justify-between items-center text-sm mt-4 p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                <span className="text-slate-400 font-medium">Sum of Weights:</span>
                <strong className={cn("text-lg", weightsSum === 1.0 ? "text-emerald-400" : "text-red-400")}>
                  {weightsSum.toFixed(2)} {weightsSum !== 1.0 && <span className="text-xs ml-2 text-red-400/80 uppercase tracking-wider">⚠️ (Must equal 1.00)</span>}
                </strong>
              </div>
            </div>

            <div className="mt-6">
              <span className="section-header block mb-4">
                Explicitly Out of Scope
              </span>
              <div className="flex flex-col gap-4">
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
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

function formatLastUpdated(lastUpdated?: string) {
  if (!lastUpdated) return "";
  const diffMs = Date.now() - new Date(lastUpdated).getTime();
  if (isNaN(diffMs)) return "";
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 0) return "just now";
  if (diffMins < 60) {
    return `${diffMins}m ago`;
  }
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function ComponentBar({
  label,
  value,
  weight,
  color,
  stale,
  isUncovered,
  lastUpdated,
}: {
  label: string;
  value: number;
  weight: number;
  color: string;
  stale?: boolean;
  isUncovered?: boolean;
  lastUpdated?: string;
}) {
  const percentContribution = value * weight * 100;
  const displayValue = value;
  const displayWidth = value * 100;
  const timeStr = lastUpdated ? formatLastUpdated(lastUpdated) : "";
  
  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-2">
        <span className={cn("text-sm font-medium flex items-center gap-2", (stale || isUncovered) ? "text-slate-400" : "text-slate-300")}>
          {label} 
          {isUncovered && (
            <span className="text-[10px] font-bold uppercase tracking-wider bg-sky-500/10 text-sky-400 px-1.5 py-0.5 rounded border border-sky-500/20">
              No Coverage
            </span>
          )}
          {stale && !isUncovered && (
            <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/20">
              Stale {timeStr ? `(${timeStr})` : ""}
            </span>
          )}
        </span>
        <span className="text-xs text-slate-500 font-medium">
          <span>
            Signal: <strong className={stale ? "text-slate-400" : "text-slate-300"}>{displayValue.toFixed(2)}</strong> <span className="opacity-50 mx-1">|</span> Contribution: <strong className={stale ? "text-slate-400" : "text-slate-300"}>+{percentContribution.toFixed(1)}%</strong>
          </span>
        </span>
      </div>
      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${displayWidth}%` }}
          transition={{ type: "spring", bounce: 0, duration: 0.8 }}
          className="h-full rounded-full"
          style={{
            backgroundColor: stale ? "#475569" : color,
            boxShadow: stale ? "none" : `0 0 10px ${color}80`,
          }}
        />
      </div>
    </div>
  );
}
