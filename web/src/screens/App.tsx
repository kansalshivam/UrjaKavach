import { useState } from "react";
import { TwinMap } from "./TwinMap";

type Tab = "dashboard" | "map" | "simulator";

export function App() {
  const [activeTab, setActiveTab] = useState<Tab>("map"); // Default to map for Phase 5

  return (
    <div className="app-container">
      <header className="top-bar">
        <div className="logo-section">
          <h1>Urja Kavach Operations Console</h1>
        </div>
        <nav className="nav-tabs">
          <button
            className={`tab-btn ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
            Command Dashboard
          </button>
          <button
            className={`tab-btn ${activeTab === "map" ? "active" : ""}`}
            onClick={() => setActiveTab("map")}
          >
            Digital Twin Map
          </button>
          <button
            className={`tab-btn ${activeTab === "simulator" ? "active" : ""}`}
            onClick={() => setActiveTab("simulator")}
          >
            Scenario Simulator
          </button>
        </nav>
      </header>

      <main className="main-content">
        {activeTab === "map" && <TwinMap />}
        {activeTab === "dashboard" && (
          <div style={{ padding: "32px", maxWidth: "800px" }}>
            <h2 className="eyebrow" style={{ color: "#38bdf8" }}>System Dashboard</h2>
            <h1 style={{ fontSize: "2.5rem", marginBottom: "16px" }}>Operations Dashboard</h1>
            <p className="lede">
              Ingestion and scoring engines are online. Per-corridor risk scores are computed every 10 minutes from live GDELT and EIA price signals.
            </p>
          </div>
        )}
        {activeTab === "simulator" && (
          <div style={{ padding: "32px", maxWidth: "800px" }}>
            <h2 className="eyebrow" style={{ color: "#38bdf8" }}>Scenario Engine</h2>
            <h1 style={{ fontSize: "2.5rem", marginBottom: "16px" }}>Crisis Simulator</h1>
            <p className="lede">
              Interactive supply chain disruption model. Simulates capacity shortfalls, cascading flow rerouting, and strategic petroleum reserve (SPR) drawdown impacts.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

