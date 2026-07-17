import React, { useState, useRef } from "react";
import { CircularGallery } from "../components/gallery/CircularGallery";
import { TimelineSync } from "../components/timeline/TimelineSync";
import { HoverVideoPlayer } from "../components/media/HoverVideoPlayer";
import { ScrollProgress } from "../components/motion/ScrollProgress";
import { Particles } from "@/components/ui/Particles";
import { TextGenerateEffect } from "@/components/ui/TextGenerateEffect";
import { ShimmerButton } from "@/components/ui/ShimmerButton";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { GlassCard } from "@/components/ui/GlassCard";
import { useGSAP } from "@gsap/react";
import { InteractiveGrid } from "../components/backgrounds/InteractiveGrid";
import gsap from "gsap";

interface LandingProps {
  onLogin: () => void;
}

const TIMELINE_EVENTS = [
  { date: "Feb 28, 2026", title: "Disruption Starts", description: "Maritime worker strikes and supply pipeline bottlenecks trigger first constraints.", severity: "medium" as const },
  { date: "Mar 4, 2026", title: "Force Majeure", description: "Terminal operators declare force majeure at key shipping nodes; risk escalation flagged.", severity: "high" as const },
  { date: "Apr 15, 2026", title: "Brent Crude Spike", description: "Spot price volatility rises; EIA Brent spot price breaks $72/bbl.", severity: "high" as const },
  { date: "Jun 12, 2026", title: "Indo-Saudi MoU", description: "Ministry coordinates strategic crude reserves optimization agreement.", severity: "low" as const },
  { date: "July 6, 2026", title: "Price Surge", description: "Brent crude spot prices surge to $69.56/bbl as geopolitical tensions rise.", severity: "medium" as const },
  { date: "July 10, 2026", title: "OFAC Sanctions", description: "New restrictions on trade entities are published; sanctions volume increases.", severity: "medium" as const },
  { date: "July 14, 2026", title: "Strait of Hormuz Alert", description: "Strait of Hormuz capacity drops; scheduler triggers live risk recalculation alert.", severity: "high" as const },
];

export function Landing({ onLogin }: LandingProps) {
  const [operatorId, setOperatorId] = useState("IND-2026-OPS");
  const [password, setPassword] = useState("••••••••");
  const [error, setError] = useState<string | null>(null);
  const [activeTimelineIndex, setActiveTimelineIndex] = useState(4);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline();
    tl.from(".gsap-fade", {
      y: 30,
      opacity: 0,
      duration: 0.8,
      stagger: 0.15,
      ease: "power3.out",
      clearProps: "all"
    });
  }, { scope: containerRef });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!operatorId || !password) {
      setError("Please fill in all security authorization fields.");
      return;
    }
    setIsAuthenticating(true);
    setTimeout(() => {
      onLogin();
    }, 800); // Fake delay to show shimmer button loading state
  };

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col items-center justify-start h-screen w-full bg-slate-950 text-slate-200 p-6 md:p-10 lg:p-12 lg:justify-center overflow-y-auto overflow-x-hidden font-sans"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black z-0" />
      <Particles quantity={80} className="z-0" />
      <InteractiveGrid />
      <ScrollProgress />

      <div className="relative z-10 w-full max-w-[90%] xl:max-w-[1500px] grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-12 items-center py-4">
        
        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-6">
          <div className="gsap-fade">
            <span className="inline-block px-4 py-1 rounded-full text-xs font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 mb-4 uppercase tracking-wider shadow-[0_0_15px_rgba(56,189,248,0.15)]">
              Ministry Control-Room View — Prototype
            </span>
            <TextGenerateEffect 
              words="Urja Kavach" 
              className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-100 mb-2 tracking-tighter"
              duration={0.8}
            />
            <p className="text-base md:text-lg text-slate-400 leading-relaxed max-w-xl mt-2">
              AI-Driven Energy Supply Chain Resilience Operations console for import-dependent economies.
            </p>
            
            {/* Animated Metrics Strip */}
            <div className="flex flex-wrap gap-8 md:gap-12 mt-4 border-t border-slate-800/80 pt-4">
              <div>
                <AnimatedCounter value={37} className="text-4xl text-sky-400" />
                <div className="text-xs uppercase text-slate-500 font-bold tracking-wider mt-1">Supply Nodes</div>
              </div>
              <div>
                <AnimatedCounter value={4} className="text-4xl text-purple-400" />
                <div className="text-xs uppercase text-slate-500 font-bold tracking-wider mt-1">Threat Vectors</div>
              </div>
              <div>
                <AnimatedCounter value={24} suffix="/7" className="text-4xl text-amber-400" />
                <div className="text-xs uppercase text-slate-500 font-bold tracking-wider mt-1">Live Coverage</div>
              </div>
            </div>
          </div>

          <GlassCard className="p-4" animate={false}>
            <h3 className="text-xs font-bold uppercase text-slate-500 tracking-widest ml-4 mt-2" style={{ color: "#94a3b8" }}>
              Geopolitical Crisis Interactive Timeline
            </h3>
            
            <CircularGallery 
              events={TIMELINE_EVENTS} 
              activeIndex={activeTimelineIndex} 
              onSelect={(idx) => setActiveTimelineIndex(idx)} 
            />

            <div className="px-5 pb-5 mt-2">
              <TimelineSync 
                events={TIMELINE_EVENTS} 
                activeIndex={activeTimelineIndex} 
                onChangeActiveIndex={(idx) => setActiveTimelineIndex(idx)} 
              />
            </div>
          </GlassCard>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-8">
          <GlassCard glowColor="blue" className="p-8" animate={false} style={{ background: 'rgba(10, 15, 30, 0.95)', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
            <h2 className="text-2xl font-bold mb-2" style={{ color: "#f8fafc" }}>
              Operator Authentication
            </h2>
            <p className="text-sm mb-8" style={{ color: "#94a3b8" }}>
              Enter security authorization keycodes to access the resilience console.
            </p>

            <form onSubmit={handleLogin} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#94a3b8" }}>Operator ID</label>
                <input
                  type="text"
                  value={operatorId}
                  onChange={(e) => setOperatorId(e.target.value)}
                  className="border border-slate-600 rounded-lg p-3 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all text-base"
                  style={{ color: '#f8fafc', backgroundColor: 'rgba(2, 6, 23, 0.85)' }}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#94a3b8" }}>Security Passcode</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border border-slate-600 rounded-lg p-3 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all text-base"
                  style={{ color: '#f8fafc', backgroundColor: 'rgba(2, 6, 23, 0.85)' }}
                />
              </div>

              {error && (
                <p className="text-sm text-red-400 m-0">
                  {error}
                </p>
              )}

              <ShimmerButton 
                type="submit" 
                className="mt-4 w-full" 
                size="lg"
                loading={isAuthenticating}
              >
                Authorize System Access
              </ShimmerButton>
            </form>
          </GlassCard>

          <div className="gsap-fade h-36">
            <HoverVideoPlayer 
              thumbnailUrl="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80"
              videoUrl="https://assets.mixkit.co/videos/preview/mixkit-cargo-ship-sailing-in-the-sea-aerial-view-34282-large.mp4"
              overlayText="Geospatial Control Room Briefing Overview"
              metadata={
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950/40 backdrop-blur-[1px] p-4 text-center">
                  <p className="m-0 text-sm text-slate-200 font-semibold tracking-wide">System Walk-Through: Screens 1 to 4</p>
                  <p className="m-0 mt-2 text-[10px] text-sky-400 font-bold tracking-widest uppercase bg-sky-950/60 border border-sky-500/30 px-3 py-1 rounded-full">
                    Hover to Play Preview
                  </p>
                </div>
              }
            />
          </div>
        </div>

      </div>
    </div>
  );
}
