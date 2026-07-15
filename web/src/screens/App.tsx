import { useState } from "react";
import { TwinMap } from "./TwinMap";
import { Dashboard } from "./Dashboard";
import { Simulator } from "./Simulator";
import { Narrative } from "./Narrative";
import { Landing } from "./Landing";
import { Procurement } from "./Procurement";
import { Reserve } from "./Reserve";
import { SourceLibrary } from "./SourceLibrary";

type Tab = "dashboard" | "map" | "simulator" | "narrative" | "procurement" | "reserve" | "library";

export function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("map"); // Default to map for Phase 5

  const [weights, setWeights] = useState({
    gdelt_volume: 0.35,
    price_volatility: 0.25,
    ais_deviation: 0.30,
    sanctions_flag: 0.10,
  });
  const [customNodeRisks, setCustomNodeRisks] = useState<Record<string, number> | null>(null);

  if (!isLoggedIn) {
    return <Landing onLogin={() => setIsLoggedIn(true)} />;
  }

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
          <button
            className={`tab-btn ${activeTab === "narrative" ? "active" : ""}`}
            onClick={() => setActiveTab("narrative")}
          >
            Risk Narrative
          </button>
          <button
            className={`tab-btn ${activeTab === "procurement" ? "active" : ""}`}
            onClick={() => setActiveTab("procurement")}
          >
            Sourcing Recommender
          </button>
          <button
            className={`tab-btn ${activeTab === "reserve" ? "active" : ""}`}
            onClick={() => setActiveTab("reserve")}
          >
            Reserve Planner
          </button>
          <button
            className={`tab-btn ${activeTab === "library" ? "active" : ""}`}
            onClick={() => setActiveTab("library")}
          >
            RAG Source Library
          </button>
        </nav>
      </header>

      <main className="main-content">
        {activeTab === "map" && <TwinMap customNodeRisks={customNodeRisks} />}
        {activeTab === "dashboard" && (
          <Dashboard
            weights={weights}
            setWeights={setWeights}
            setCustomNodeRisks={setCustomNodeRisks}
          />
        )}
        {activeTab === "simulator" && <Simulator />}
        {activeTab === "narrative" && <Narrative />}
        {activeTab === "procurement" && <Procurement />}
        {activeTab === "reserve" && <Reserve />}
        {activeTab === "library" && <SourceLibrary />}
      </main>
    </div>
  );
}



