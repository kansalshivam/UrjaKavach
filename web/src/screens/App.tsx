import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import AnimatedCursor from "react-animated-cursor";
import {
  LayoutDashboard,
  Globe2,
  FlaskConical,
  FileText,
  Search,
  ShieldCheck,
  Library,
  Bell,
} from "lucide-react";

import { TwinMap } from "./TwinMap";
import { Dashboard } from "./Dashboard";
import { Simulator } from "./Simulator";
import { Narrative } from "./Narrative";
import { Landing } from "./Landing";
import { Procurement } from "./Procurement";
import { Reserve } from "./Reserve";
import { SourceLibrary } from "./SourceLibrary";
import { AlertsArchive } from "./AlertsArchive";
import { TabButton } from "@/components/ui/TabButton";

type Tab = "dashboard" | "map" | "simulator" | "narrative" | "procurement" | "reserve" | "library" | "alerts";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard", label: "Command Dashboard", icon: <LayoutDashboard size={16} /> },
  { id: "map", label: "Digital Twin Map", icon: <Globe2 size={16} /> },
  { id: "simulator", label: "Scenario Simulator", icon: <FlaskConical size={16} /> },
  { id: "narrative", label: "Risk Narrative", icon: <FileText size={16} /> },
  { id: "procurement", label: "Sourcing Recommender", icon: <Search size={16} /> },
  { id: "reserve", label: "Reserve Planner", icon: <ShieldCheck size={16} /> },
  { id: "library", label: "Reference Model Library", icon: <Library size={16} /> },
  { id: "alerts", label: "Alerts Archive", icon: <Bell size={16} /> },
];

export function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

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

  const renderActiveScreen = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <Dashboard
            weights={weights}
            setWeights={setWeights}
            setCustomNodeRisks={setCustomNodeRisks}
          />
        );
      case "map":
        return <TwinMap customNodeRisks={customNodeRisks} />;
      case "simulator":
        return <Simulator />;
      case "narrative":
        return <Narrative />;
      case "procurement":
        return <Procurement />;
      case "reserve":
        return <Reserve />;
      case "library":
        return <SourceLibrary />;
      case "alerts":
        return <AlertsArchive />;
    }
  };

  return (
    <div className="app-container">
      {/* Animated cursor — hidden on map tab to avoid interfering with Leaflet */}
      {activeTab !== "map" && (
        <AnimatedCursor
          innerSize={8}
          outerSize={35}
          innerScale={1}
          outerScale={2}
          outerAlpha={0}
          innerStyle={{ backgroundColor: "#38bdf8" }}
          outerStyle={{ border: "2px solid rgba(56, 189, 248, 0.4)" }}
          clickables={[
            "a", "input[type='text']", "input[type='email']",
            "input[type='password']", "input[type='number']",
            "input[type='submit']", "input[type='range']",
            "label[for]", "select", "textarea",
            "button", ".link", ".tab-btn",
          ]}
        />
      )}

      {activeTab === "map" && (
        <style>{`
          *, *::before, *::after, body, html, .app-container, .top-bar, .top-bar * {
            cursor: auto !important;
          }
          a, button, select, input[type="submit"], .tab-btn, [role="button"], .leaflet-interactive {
            cursor: pointer !important;
          }
        `}</style>
      )}

      {/* Cleanup: when AnimatedCursor unmounts, reset body cursor */}
      {activeTab !== "map" && (
        <style>{`
          body { cursor: none; }
        `}</style>
      )}

      {/* Premium header with gradient logo and animated tabs */}
      <header className="top-bar">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-purple-500 flex items-center justify-center">
            <ShieldCheck size={18} className="text-white" />
          </div>
          <h1 className="text-lg font-extrabold m-0 text-gradient">
            Urja Kavach Operations Console
          </h1>
        </div>

        <nav className="nav-tabs">
          {TABS.map((tab) => (
            <TabButton
              key={tab.id}
              label={tab.label}
              icon={tab.icon}
              isActive={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              layoutId="active-tab-indicator"
            />
          ))}
        </nav>
      </header>

      {/* Main content with page transition animations */}
      <main className="main-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className={activeTab === "map" ? "map-active" : ""}
          >
            {renderActiveScreen()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
