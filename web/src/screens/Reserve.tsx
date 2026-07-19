import React, { useEffect, useState, useRef } from "react";
import { Checkbox } from "../components/animate/Checkbox";
import { GlassCard } from "@/components/ui/GlassCard";
import { CustomSlider } from "@/components/ui/CustomSlider";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { Database, Settings2, ShieldCheck, Activity, Droplets } from "lucide-react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { cn } from "@/lib/utils";

interface Cavern {
  name: string;
  capacity_mmt: number;
  fill_pct: number;
  current_stock_mmt: number;
}

interface CalculationResult {
  isprl_available_barrels: number;
  omc_available_barrels: number;
  total_available_barrels: number;
  raw_shortfall_barrels_day: number;
  mitigated_shortfall_barrels_day: number;
  days_cover_remaining: number;
  iea_benchmark_days: number;
  caverns: Cavern[];
}

export function Reserve() {
  const [shortfall, setShortfall] = useState(30.0);
  const [useIsprl, setUseIsprl] = useState(true);
  const [useOmc, setUseOmc] = useState(false);
  const [useDiversification, setUseDiversification] = useState(true);

  const [result, setResult] = useState<CalculationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.from(".res-fade", {
      y: 20,
      opacity: 0,
      duration: 0.6,
      stagger: 0.1,
      ease: "power2.out",
      clearProps: "all"
    });
  }, { scope: containerRef });

  const fetchCalculation = async () => {
    try {
      const resp = await fetch("/api/reserve/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shortfall_pct: shortfall,
          use_isprl: useIsprl,
          use_omc: useOmc,
          use_diversification: useDiversification,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        setResult(data);
      }
    } catch (e) {
      console.error("Failed to compute reserve planning", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalculation();
  }, [shortfall, useIsprl, useOmc, useDiversification]);

  return (
    <div ref={containerRef} className="p-6 md:p-10 max-w-[95%] xl:max-w-[1800px] mx-auto flex flex-col gap-6 w-full">
      {/* Header card containing verified ISPRL & OMC benchmark metadata */}
      <GlassCard className="res-fade p-8" glowColor="purple" animate={false}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="section-header mb-2 flex items-center gap-2">
              <Database className="w-5 h-5 text-purple-400" /> Strategic Reserve Optimisation
            </h2>
            <h1 className="text-3xl font-bold text-slate-100 tracking-tight">
              Strategic Reserve Drawdown Planner
            </h1>
            <p className="text-slate-400 mt-2 max-w-2xl text-lg">
              Model India's Strategic Petroleum Reserve (ISPRL) rock caverns stock and OMC commercial buffers during Hormuz supply disruptions.
            </p>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sidebar Controls Panel */}
        <GlassCard className="res-fade p-6 lg:col-span-4 sticky top-6">
          <h2 className="text-xl font-bold text-slate-100 mb-6 pb-4 border-b border-slate-800/80 flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-sky-400" /> Scenario Parameters
          </h2>

          {/* Import Shortfall Slider */}
          <div className="flex flex-col gap-4 mb-8">
            <div className="flex justify-between items-end">
              <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Import Shortfall</label>
              <span className="text-2xl font-black text-sky-400 tabular-nums leading-none tracking-tighter">
                <AnimatedCounter value={shortfall} />%
              </span>
            </div>
            <CustomSlider
              value={shortfall}
              onChange={(v) => setShortfall(v)}
              min={1} max={100} step={1}
              ariaLabel="Import Shortfall (%)"
            />
          </div>

          {/* Scenario Toggles using custom Checkboxes */}
          <div className="flex flex-col gap-4 mb-8">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Reserves Drawdown Options</h3>
            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 flex flex-col gap-4 shadow-inner">
              <Checkbox
                id="isprl-toggle"
                checked={useIsprl}
                onCheckedChange={(val) => setUseIsprl(val)}
                label="Drawdown ISPRL Rock Caverns (3.37 MMT)"
              />
              <Checkbox
                id="omc-toggle"
                checked={useOmc}
                onCheckedChange={(val) => setUseOmc(val)}
                label="Drawdown OMC Commercial Buffers (64.5 Days)"
              />
              <Checkbox
                id="diversification-toggle"
                checked={useDiversification}
                onCheckedChange={(val) => setUseDiversification(val)}
                label="Apply Sourcing Diversification"
              />
            </div>
          </div>

          <div className="bg-slate-800/30 border border-slate-700/50 p-5 rounded-xl flex gap-3 items-start relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-slate-500" />
            <div className="flex flex-col gap-3">
              <strong className="block text-slate-300 font-bold text-sm">
                Illustrative Heuristic Model Disclosure
              </strong>
              <p className="text-xs text-slate-400 leading-relaxed m-0">
                The 15.0% sourcing diversification mitigation is modeled as a fixed absolute volume offset (660,000 bpd, representing 15% of the 4.4M bpd baseline import capacity) against the daily import shortfall. Cavern capacities are adjusted to match the 3.372 MMT March 2026 RTI stock (~63.26% fill level).
              </p>
              <div className="pt-3 border-t border-slate-700/50 text-[11px] text-slate-500 flex gap-2 items-start">
                <ShieldCheck className="w-3 h-3 shrink-0 mt-0.5" />
                <span><strong className="text-slate-400">Reference Data Model:</strong> This planner operates as a static reference-parameter calculator grounded in the dossier's historical specs.</span>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Results Panel */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {loading || !result ? (
            <GlassCard className="p-10 flex flex-col items-center justify-center gap-4 text-sky-400">
              <Activity className="w-8 h-8 animate-pulse" />
              <p className="font-medium animate-pulse">Calculating reserve models...</p>
            </GlassCard>
          ) : (
            <>
              {/* Top metrics rows */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                {/* Daily Shortfall Card */}
                <GlassCard className="res-fade p-6 flex flex-col justify-between" glowColor="red">
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Shortfall Load</span>
                    <div className="flex items-baseline gap-1">
                      <AnimatedCounter 
                        value={result.mitigated_shortfall_barrels_day / 1000000} 
                        decimals={2}
                        className="text-4xl font-black text-red-400 tracking-tighter"
                      />
                      <span className="text-lg font-bold text-slate-400">M bpd</span>
                    </div>
                  </div>
                  {result.raw_shortfall_barrels_day !== result.mitigated_shortfall_barrels_day && (
                    <div className="mt-6 pt-3 border-t border-slate-800/80 text-xs font-medium text-emerald-400 flex items-center gap-1.5 bg-emerald-500/5 p-2 rounded">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Mitigated from {(result.raw_shortfall_barrels_day / 1000000).toFixed(2)}M bpd
                    </div>
                  )}
                </GlassCard>

                {/* Reserves Pool Card */}
                <GlassCard className="res-fade p-6 flex flex-col justify-between" glowColor="blue">
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Drawdown Pool Capacity</span>
                    <div className="flex items-baseline gap-1">
                      <AnimatedCounter 
                        value={result.total_available_barrels / 1000000} 
                        decimals={1}
                        className="text-4xl font-black text-sky-400 tracking-tighter"
                      />
                      <span className="text-lg font-bold text-slate-400">M bbl</span>
                    </div>
                  </div>
                  <div className="mt-6 pt-3 border-t border-slate-800/80 text-xs font-medium text-slate-400 flex items-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5 text-sky-400" />
                    Selected reserves buffer
                  </div>
                </GlassCard>

                {/* Net Days of Cover Card */}
                <GlassCard className="res-fade p-6 flex flex-col justify-between md:col-span-2 lg:col-span-1 xl:col-span-1" glowColor={result.days_cover_remaining >= 90.0 ? "green" : "amber"}>
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Net Days of National Cover</span>
                    <div className="flex items-baseline gap-1">
                      {result.days_cover_remaining >= 365.0 ? (
                        <span className="text-4xl font-black text-emerald-400 tracking-tighter">365+ Days</span>
                      ) : (
                        <>
                          <AnimatedCounter 
                            value={result.days_cover_remaining} 
                            decimals={1}
                            className={cn(
                              "text-4xl font-black tracking-tighter",
                              result.days_cover_remaining >= 90.0 ? "text-emerald-400" : "text-amber-400"
                            )}
                          />
                          <span className="text-lg font-bold text-slate-400">Days</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="mt-6 pt-3 border-t border-slate-800/80 text-xs font-medium text-slate-400 flex items-center justify-between">
                    <span>IEA Benchmark target:</span>
                    <strong className="text-slate-200">90.0 Days</strong>
                  </div>
                </GlassCard>
              </div>

              {/* ISPRL Caverns inventory detailed breakdown */}
              <GlassCard className="res-fade p-6 md:p-8" animate={false}>
                <h3 className="text-lg font-bold text-slate-100 mb-6 flex items-center gap-2">
                  <Database className="w-5 h-5 text-purple-400" /> ISPRL Cavern Inventories 
                  <span className="text-xs font-medium bg-slate-800/80 border border-slate-700 text-slate-300 px-2.5 py-1 rounded-full ml-2">Verified March 2026 RTI Data</span>
                </h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="px-4 py-4 font-bold">Facility Location</th>
                        <th className="px-4 py-4 font-bold">Total Capacity</th>
                        <th className="px-4 py-4 font-bold">Current Fill Level</th>
                        <th className="px-4 py-4 font-bold text-right">Estimated Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {result.caverns.map((cavern) => (
                        <tr key={cavern.name} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-4 font-bold text-slate-200">{cavern.name}</td>
                          <td className="px-4 py-4 text-slate-400">{cavern.capacity_mmt.toFixed(2)} MMT</td>
                          <td className="px-4 py-4">
                            <span className="inline-flex items-center gap-2 font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                              {cavern.fill_pct}%
                            </span>
                          </td>
                          <td className="px-4 py-4 font-bold text-sky-400 text-right tabular-nums">{cavern.current_stock_mmt.toFixed(3)} MMT</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </GlassCard>

              {/* SPR Total Inventory Summary */}
              <GlassCard className="res-fade p-6 animate-none" animate={false}>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Database className="w-4 h-4 text-sky-400" /> SPR Total Storage Overview
                </h3>
                <div className="flex flex-col gap-4">
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-medium">
                      <span>Total Caverns Utilization</span>
                      <span className="font-bold text-sky-400">3.37 / 5.33 MMT (63.3%)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-sky-500 to-purple-500 rounded-full" style={{ width: "63.26%" }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-2 pt-4 border-t border-slate-800/80">
                    <div>
                      <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block mb-1">OMC Commercial Stock</span>
                      <strong className="text-sm font-bold text-slate-200">64.5 Days Cover</strong>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Total Available Crude</span>
                      <strong className="text-sm font-bold text-slate-200">{(result.total_available_barrels / 1000000).toFixed(1)} M bbl</strong>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
