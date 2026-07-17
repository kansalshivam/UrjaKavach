import React, { useEffect, useState, useRef } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { CustomSlider } from "@/components/ui/CustomSlider";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { Ship, Info, AlertTriangle, ShieldCheck, Map, Search } from "lucide-react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { cn } from "@/lib/utils";

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
  const [capacity, setCapacity] = useState(50.0);
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.from(".proc-header", {
      y: -20,
      opacity: 0,
      duration: 0.6,
      ease: "power2.out",
      clearProps: "all"
    });
  }, { scope: containerRef });

  useGSAP(() => {
    if (!loading && recommendations.length > 0) {
      gsap.from(".proc-card", {
        x: -20,
        opacity: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: "power2.out",
        clearProps: "all"
      });
    }
  }, [loading, recommendations]);

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
    <div ref={containerRef} className="p-6 md:p-10 max-w-[95%] xl:max-w-[1800px] mx-auto flex flex-col gap-8 w-full">
      {/* Header section with benchmark information */}
      <GlassCard className="proc-header p-8" glowColor="blue" animate={false}>
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-8 border-b border-slate-800/80 pb-6">
          <div>
            <h2 className="section-header mb-2 flex items-center gap-2">
              <Ship className="w-5 h-5" /> Adaptive Sourcing Ranker
            </h2>
            <h1 className="text-3xl font-bold text-slate-100 tracking-tight">
              Procurement Diversification Models
            </h1>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 min-w-[300px] w-full xl:w-auto shadow-inner">
            <label className="text-sm font-semibold text-slate-400 whitespace-nowrap">Simulated Corridor Capacity:</label>
            <div className="flex-1 w-full flex items-center gap-4">
              <div className="flex-1">
                <CustomSlider
                  value={capacity}
                  onChange={(v) => setCapacity(v)}
                  min={0} max={100} step={5}
                  ariaLabel="Hormuz Shortfall (%)"
                />
              </div>
              <div className="text-xl font-bold text-sky-400 w-16 text-right tabular-nums">
                {capacity.toFixed(0)}%
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-xl flex gap-4 items-start relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-amber-500 font-bold mb-2">
                2026 Crisis Benchmark Alignment
              </strong>
              <p className="text-sm text-amber-100/70 leading-relaxed m-0">
                During the worst weeks of the 2026 disruption, India's refiners pivoted to alternative sourcing routes, successfully raising the non-Hormuz sourcing share of imports from <strong className="text-amber-200">~55% to ~70%</strong> within weeks by drawing heavily from West Africa, the Americas, and Russia.
              </p>
            </div>
          </div>

          <div className="bg-slate-800/30 border border-slate-700/50 p-5 rounded-xl flex gap-4 items-start relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-slate-500" />
            <Info className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-3">
              <strong className="block text-slate-300 font-bold">
                Illustrative Heuristic Model Disclosure
              </strong>
              <p className="text-sm text-slate-400 leading-relaxed m-0">
                Suitability scores use an illustrative heuristic model based on grade compatibility, transit latency, and routing risk coefficients. Base weights and disruption scaling represent qualitative optimization modeling of refinery input configurations rather than official static government scores.
              </p>
              <div className="pt-3 border-t border-slate-700/50 text-xs text-slate-500 flex gap-2 items-start">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span><strong className="text-slate-400">Reference Data Model:</strong> This planner operates as a static reference-parameter calculator grounded in historical specs.</span>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-4 text-sky-400">
          <Search className="w-8 h-8 animate-pulse" />
          <p className="font-medium animate-pulse">Calculating optimal procurement matrices...</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {recommendations.map((rec) => (
            <GlassCard
              key={rec.rank}
              className={cn(
                "proc-card p-6 md:p-8 flex flex-col gap-5 transition-all hover:bg-slate-800/60 relative",
                rec.rank === 1 ? "border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.1)]" : ""
              )}
              glowColor={rec.rank === 1 ? "green" : undefined}
            >
              {/* Card inner: stacked layout that works at all viewports */}
              <div className="flex items-start gap-5 w-full">
                {/* Rank badge */}
                <div className="flex-shrink-0">
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold border-2 shadow-inner",
                    rec.rank === 1 
                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" 
                      : "bg-slate-800/80 border-slate-700 text-slate-300"
                  )}>
                    #{rec.rank}
                  </div>
                </div>

                {/* Main content area */}
                <div className="flex-1 min-w-0">
                  {/* Country + Grade */}
                  <h3 className="text-xl font-bold text-slate-100 mb-1">{rec.country}</h3>
                  <span className="text-sm font-medium text-slate-400 flex items-center gap-1.5 mb-4">
                    <Droplets className="w-3.5 h-3.5 text-sky-400" /> Grade: {rec.grade}
                  </span>

                  {/* Metrics row — uses CSS grid to prevent overlap */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Compatibility</span>
                      <span className={cn(
                        "text-sm font-bold px-2.5 py-1 rounded-md inline-flex items-center w-fit",
                        rec.quality_compatibility === "High" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      )}>
                        {rec.quality_compatibility}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Transit & Cost</span>
                      <div className="text-sm font-medium text-slate-300 flex items-center gap-2 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Map className="w-3.5 h-3.5 text-slate-400" /> {rec.transit_days}d
                        </span>
                        <span className="text-slate-600">|</span>
                        <span className={cn(
                          rec.cost_premium.includes("Premium") ? "text-amber-400" : "text-emerald-400"
                        )}>{rec.cost_premium}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Suitability</span>
                      <div className="text-2xl font-black text-sky-400 tracking-tighter drop-shadow-sm flex items-baseline">
                        <AnimatedCounter value={rec.suitability_score} />
                        <span className="text-lg text-sky-400/50">%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom row: 2026 Ground Truth */}
              <div className="w-full border-t border-slate-700/50 pt-4">
                <div className="text-sm text-slate-400 leading-relaxed bg-slate-900/50 p-4 rounded-lg w-full">
                  <strong className="text-sky-400 font-semibold">2026 Ground Truth: </strong> 
                  <span className="italic">{rec.actual_2026_role}</span>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}

// Needed missing icon for this page
function Droplets(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7 2.9 7 2.9s-2.29 3.06-4.58 6.16C1.28 10 7 10 7 16.3Z" />
      <path d="M12.22 21A4.54 4.54 0 0 0 17 16.5c0-1.28-.62-2.5-1.85-3.5S11 8.5 11 8.5s-2.4 3.4-4.7 6.6c-1.15 1.5-1.08 4.2 1.92 5.9Z" />
    </svg>
  );
}
