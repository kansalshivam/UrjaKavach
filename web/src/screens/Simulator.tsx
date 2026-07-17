import { useState, useEffect, useRef } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { CustomSlider } from "@/components/ui/CustomSlider";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { TextGenerateEffect } from "@/components/ui/TextGenerateEffect";
import { AlertTriangle, Activity, ShieldAlert, Droplets } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

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
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.from(".sim-fade", {
      y: 20,
      opacity: 0,
      duration: 0.6,
      stagger: 0.1,
      ease: "power2.out",
      clearProps: "all"
    });
  }, { scope: containerRef });

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
    }, 250);

    return () => clearTimeout(triggerSim);
  }, [sliderValue]);

  const getCapacityColor = (val: number) => {
    if (val < 30) return "red";
    if (val < 70) return "amber";
    return "green";
  };
  
  const capacityColor = getCapacityColor(sliderValue);

  return (
    <div ref={containerRef} className="p-6 md:p-10 max-w-[95%] xl:max-w-[1500px] mx-auto flex flex-col gap-8 w-full">
      <div className="sim-fade">
        <h2 className="section-header mb-2 flex items-center gap-2">
          <Activity className="w-5 h-5" /> Simulation Engine
        </h2>
        <h1 className="text-4xl font-bold text-slate-100 mb-4 tracking-tight">Strategic Reserve & Flow Simulator</h1>
        <p className="text-lg text-slate-400 leading-relaxed max-w-3xl">
          Model a supply chain crisis along the Strait of Hormuz. Adjust the capacity slider to simulate blockades or shipping route disruptions, observing cascading effects on crude import shortfalls and strategic reserve drawdowns.
        </p>
      </div>

      <GlassCard className="sim-fade p-8" glowColor={capacityColor}>
        <div className="flex justify-between items-center mb-6 border-b border-slate-800/80 pb-4">
          <span className="text-lg font-semibold text-slate-200">
            Strait of Hormuz Available Capacity
          </span>
          <div className={cn(
            "text-4xl font-black tabular-nums tracking-tighter",
            capacityColor === "red" ? "text-red-400 drop-shadow-[0_0_15px_rgba(248,113,113,0.3)]" :
            capacityColor === "amber" ? "text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.3)]" :
            "text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]"
          )}>
            {sliderValue}%
          </div>
        </div>

        <div className="px-2">
          <CustomSlider
            value={sliderValue}
            onChange={(v) => setSliderValue(v)}
            min={0} max={100} step={5}
            ariaLabel="Corridor Capacity Available"
            colorScheme={capacityColor === "green" ? "blue" : undefined}
          />
        </div>

        <div className="flex justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider mt-4 px-2">
          <span>0% (Full Closure)</span>
          <span>30% (Worst Historical)</span>
          <span>100% (Normal)</span>
        </div>
      </GlassCard>

      {error && (
        <GlassCard glowColor="red" className="sim-fade p-6 bg-red-950/20 border-red-900/30">
          <h3 className="text-xl font-bold text-red-400 flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5" /> Simulator Error
          </h3>
          <p className="text-red-200/70">{error}</p>
        </GlassCard>
      )}

      {result && (
        <div className="flex flex-col gap-8">
          <div className="sim-fade bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-4 items-start shadow-inner">
            <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-500/90 leading-relaxed">
              <strong className="block text-amber-500 font-bold mb-1 text-base">Calibration Notice</strong> 
              This simulation uses a two-point linear interpolation based on historical benchmarks. Note that two real data points do not make a validated curve.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Metric 1: Import decline */}
            <GlassCard 
              className="sim-fade p-8 flex flex-col justify-between"
              glowColor={result.projected_import_volume_change_pct < -15 ? "red" : undefined}
            >
              <div>
                <span className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 mb-4">
                  <Droplets className="w-4 h-4" /> Projected Import Loss
                </span>
                <div className="flex items-baseline gap-2">
                  <AnimatedCounter 
                    value={result.projected_import_volume_change_pct} 
                    decimals={1} 
                    className={cn(
                      "text-5xl font-black tracking-tighter drop-shadow-sm",
                      result.projected_import_volume_change_pct < -20 ? "text-red-400" : 
                      result.projected_import_volume_change_pct < -10 ? "text-amber-400" : "text-slate-100"
                    )}
                  />
                  <span className="text-2xl text-slate-400 font-bold">%</span>
                </div>
              </div>
              <div className="text-xs font-medium text-slate-500 mt-8 pt-4 border-t border-slate-800/80">
                Baseline: 100% capacity <span className="mx-2 opacity-50">|</span> Anchor: -23.0% drop at 30% available
              </div>
            </GlassCard>

            {/* Metric 2: SPR Days Cover remaining */}
            <GlassCard 
              className="sim-fade p-8 flex flex-col justify-between"
              glowColor={result.projected_spr_days_cover < 5 ? "red" : undefined}
            >
              <div>
                <span className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 mb-4">
                  <ShieldAlert className="w-4 h-4" /> Remaining Reserves Cover
                </span>
                <div className="flex items-baseline gap-2">
                  <AnimatedCounter 
                    value={result.projected_spr_days_cover} 
                    decimals={1} 
                    className={cn(
                      "text-5xl font-black tracking-tighter drop-shadow-sm",
                      result.projected_spr_days_cover < 3.0 ? "text-red-400" : 
                      result.projected_spr_days_cover < 7.0 ? "text-amber-400" : "text-emerald-400"
                    )}
                  />
                  <span className="text-lg font-bold text-slate-400 uppercase tracking-widest ml-1">Days</span>
                </div>
              </div>
              <div className="text-xs font-medium text-slate-500 mt-8 pt-4 border-t border-slate-800/80">
                Baseline starting reserve: ~9.5 days <span className="mx-2 opacity-50">|</span> Window: 30-day disruption
              </div>
            </GlassCard>
          </div>

          <GlassCard glowColor="blue" className="sim-fade p-8 bg-slate-900/90 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-400 via-purple-500 to-sky-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-sky-400 mb-4">
              Simulation Impact Narrative
            </h3>
            <div className="min-h-[120px]">
              {simulating ? (
                <div className="flex flex-col gap-3 animate-pulse mt-4">
                  <div className="h-4 bg-slate-800 rounded w-full"></div>
                  <div className="h-4 bg-slate-800 rounded w-5/6"></div>
                  <div className="h-4 bg-slate-800 rounded w-4/6"></div>
                </div>
              ) : (
                <div className="mt-2">
                  <TextGenerateEffect 
                    words={result.narrative_text} 
                    className="text-lg leading-relaxed text-slate-200 font-normal"
                    duration={0.5}
                  />
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
