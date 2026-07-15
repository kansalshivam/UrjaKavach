import React, { useState } from "react";
import { InteractiveGrid } from "../components/backgrounds/InteractiveGrid";
import { CircularGallery } from "../components/gallery/CircularGallery";
import { TimelineSync } from "../components/timeline/TimelineSync";
import { HoverVideoPlayer } from "../components/media/HoverVideoPlayer";
import { ScrollProgress } from "../components/motion/ScrollProgress";

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
  const [activeTimelineIndex, setActiveTimelineIndex] = useState(4); // Default to July 6

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
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        width: "100vw",
        background: "radial-gradient(circle at center, #0f172a 0%, #020617 100%)",
        color: "#e2e8f0",
        fontFamily: "system-ui, sans-serif",
        padding: "40px 20px",
        overflowY: "auto",
        boxSizing: "border-box",
      }}
    >
      {/* Scroll Progress Indicator */}
      <ScrollProgress />

      {/* Interactive Grid Background */}
      <InteractiveGrid />

      {/* Main Content Layout */}
      <div 
        style={{ 
          position: "relative",
          zIndex: 10,
          maxWidth: "1360px", 
          width: "100%", 
          display: "grid", 
          gridTemplateColumns: "1.25fr 0.75fr", 
          gap: "80px", 
          alignItems: "center" 
        }}
      >
        
        {/* LEFT COLUMN: Framing, 3D Circular Gallery & Sync Scrubber */}
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          <div>
            <span style={{ fontSize: "0.85rem", background: "rgba(56, 189, 248, 0.1)", color: "#38bdf8", padding: "6px 12px", borderRadius: "9999px", fontWeight: 600, border: "1px solid rgba(56, 189, 248, 0.2)" }}>
              Ministry Control-Room View — Prototype
            </span>
            <h1 style={{ fontSize: "3.75rem", fontWeight: 900, color: "#f8fafc", margin: "20px 0 12px", letterSpacing: "-0.03em", lineHeight: "1.1" }}>
              Urja Kavach
            </h1>
            <p style={{ fontSize: "1.2rem", color: "#cbd5e1", margin: 0, lineHeight: "1.6", maxWidth: "680px" }}>
              AI-Driven Energy Supply Chain Resilience Operations console for import-dependent economies.
            </p>
          </div>

          {/* Circular 3D Timeline Gallery */}
          <div style={{ background: "rgba(15, 23, 42, 0.4)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.05)", padding: "10px" }}>
            <h3 style={{ fontSize: "0.8rem", textTransform: "uppercase", color: "#64748b", letterSpacing: "0.05em", margin: "10px 0 0 16px" }}>
              Geopolitical Crisis Interactive Timeline
            </h3>
            
            <CircularGallery 
              events={TIMELINE_EVENTS} 
              activeIndex={activeTimelineIndex} 
              onSelect={(idx) => setActiveTimelineIndex(idx)} 
            />

            {/* Sync Scrubber */}
            <div style={{ padding: "0 20px 20px" }}>
              <TimelineSync 
                events={TIMELINE_EVENTS} 
                activeIndex={activeTimelineIndex} 
                onChangeActiveIndex={(idx) => setActiveTimelineIndex(idx)} 
              />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Demo Login Form & Hover Video Player */}
        <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
          {/* Operator Auth Card */}
          <div
            className="detail-card"
            style={{
              background: "rgba(11, 15, 25, 0.9)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(56, 189, 248, 0.1)",
              borderRadius: "16px",
              padding: "36px",
              boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.7), 0 0 30px rgba(56, 189, 248, 0.05)",
            }}
          >
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0 0 6px", color: "#f8fafc" }}>
              Operator Authentication
            </h2>
            <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "0 0 24px" }}>
              Enter security authorization keycodes to access the resilience console.
            </p>

            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
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
                    padding: "12px",
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
                    padding: "12px",
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
                  padding: "14px",
                  color: "#ffffff",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  marginTop: "8px",
                  boxShadow: "0 4px 12px rgba(2, 132, 199, 0.3)",
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = "#0369a1")}
                onMouseOut={(e) => (e.currentTarget.style.background = "#0284c7")}
              >
                Authorize System Access
              </button>
            </form>
          </div>

          {/* Hover Video Player for System Video Walkthrough / Briefing */}
          <div style={{ height: "160px" }}>
            <HoverVideoPlayer 
              thumbnailUrl="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80"
              overlayText="Geospatial Control Room Briefing Overview"
              metadata={
                <div>
                  <p style={{ margin: "4px 0 0" }}>System walk-through: Screens 1 to 4</p>
                  <p style={{ margin: "2px 0 0", color: "#38bdf8" }}>Click/hover to play preview</p>
                </div>
              }
            />
          </div>
        </div>

      </div>
    </div>
  );
}
