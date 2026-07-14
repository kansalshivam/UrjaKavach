import { useEffect, useState } from "react";

type HealthState = "checking" | "ok" | "error";

export function App() {
  const [health, setHealth] = useState<HealthState>("checking");

  useEffect(() => {
    fetch("/health")
      .then((response) => {
        setHealth(response.ok ? "ok" : "error");
      })
      .catch(() => setHealth("error"));
  }, []);

  return (
    <main className="app-shell">
      <section className="dashboard-panel">
        <div>
          <p className="eyebrow">Ministry control-room view - prototype</p>
          <h1>Urja Kavach</h1>
          <p className="lede">
            Foundation shell is online. Tier 1 live data modules are intentionally empty until
            their phases begin.
          </p>
        </div>
        <div className="status-grid">
          <Status label="API" value={health} />
          <Status label="Risk Scores" value="pending" />
          <Status label="Digital Twin Seed" value="pending verification" />
        </div>
      </section>
    </main>
  );
}

function Status({ label, value }: { label: string; value: string }) {
  return (
    <div className="status-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
