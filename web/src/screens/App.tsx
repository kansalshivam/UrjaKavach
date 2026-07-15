import { useState } from "react";
import { TwinMap } from "./TwinMap";
import { Dashboard } from "./Dashboard";
import { Simulator } from "./Simulator";
import { Narrative } from "./Narrative";
import { Landing } from "./Landing";
import { Procurement } from "./Procurement";
import { Reserve } from "./Reserve";
import { SourceLibrary } from "./SourceLibrary";
import { 
  DashboardIcon, 
  MapIcon, 
  SimulatorIcon, 
  BookIcon, 
  SearchIcon, 
  SpriteIcon, 
  LibraryIcon 
} from "../components/icons/Iconsax";

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
      <header className="top-bar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 24px", background: "#0b0f19", borderBottom: "1px solid #1e293b" }}>
        <div className="logo-section" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0, background: "linear-gradient(90deg, #38bdf8 0%, #a855f7 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Urja Kavach Operations Console
          </h1>
        </div>
        <nav className="nav-tabs" style={{ display: "flex", gap: "8px" }}>
          <button
            className={`tab-btn ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 12px", borderRadius: "6px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}
          >
            <DashboardIcon size={16} /> Command Dashboard
          </button>
          <button
            className={`tab-btn ${activeTab === "map" ? "active" : ""}`}
            onClick={() => setActiveTab("map")}
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 12px", borderRadius: "6px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}
          >
            <MapIcon size={16} /> Digital Twin Map
          </button>
          <button
            className={`tab-btn ${activeTab === "simulator" ? "active" : ""}`}
            onClick={() => setActiveTab("simulator")}
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 12px", borderRadius: "6px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}
          >
            <SimulatorIcon size={16} /> Scenario Simulator
          </button>
          <button
            className={`tab-btn ${activeTab === "narrative" ? "active" : ""}`}
            onClick={() => setActiveTab("narrative")}
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 12px", borderRadius: "6px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}
          >
            <BookIcon size={16} /> Risk Narrative
          </button>
          <button
            className={`tab-btn ${activeTab === "procurement" ? "active" : ""}`}
            onClick={() => setActiveTab("procurement")}
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 12px", borderRadius: "6px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}
          >
            <SearchIcon size={16} /> Sourcing Recommender
          </button>
          <button
            className={`tab-btn ${activeTab === "reserve" ? "active" : ""}`}
            onClick={() => setActiveTab("reserve")}
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 12px", borderRadius: "6px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}
          >
            <SpriteIcon size={16} /> Reserve Planner
          </button>
          <button
            className={`tab-btn ${activeTab === "library" ? "active" : ""}`}
            onClick={() => setActiveTab("library")}
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 12px", borderRadius: "6px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}
          >
            <LibraryIcon size={16} /> Reference Model Library
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



