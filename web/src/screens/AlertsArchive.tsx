import React, { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  Bell,
  FileDown,
  Activity,
  Newspaper,
  Calendar,
  Info,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";

interface GeopoliticalAlert {
  id: number;
  corridor: string;
  alert_type: string;
  triggered_at: string;
  value: number;
  threshold: number;
  description: string;
  raw_payload: any;
}

export function AlertsArchive() {
  const [alerts, setAlerts] = useState<GeopoliticalAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<GeopoliticalAlert | null>(null);

  const fetchAlerts = async () => {
    try {
      const resp = await fetch("/api/alerts");
      if (resp.ok) {
        const data = await resp.json();
        setAlerts(data.alerts);
        if (data.alerts.length > 0 && !selectedAlert) {
          setSelectedAlert(data.alerts[0]);
        }
      }
    } catch (e) {
      console.error("Failed to fetch alerts", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleExportCSV = () => {
    window.open("/api/alerts/export", "_blank");
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "price_volatility":
        return <Activity className="w-5 h-5 text-amber-400 animate-pulse" />;
      case "gdelt_zscore":
        return <Newspaper className="w-5 h-5 text-sky-400" />;
      default:
        return <Bell className="w-5 h-5 text-purple-400" />;
    }
  };

  const formatCorridor = (corridor: string) => {
    if (corridor === "global") return "Global Market";
    return corridor
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  return (
    <div className="p-6 md:p-10 max-w-[95%] xl:max-w-[1800px] mx-auto flex flex-col gap-8 w-full min-h-[calc(100vh-100px)]">
      {/* Header card with export functionality */}
      <GlassCard className="p-6" glowColor="purple" animate={false}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="section-header mb-1 flex items-center gap-2 text-purple-400">
              <Bell className="w-5 h-5" /> Threat Assessment Archive
            </h2>
            <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">
              Geopolitical Alert Archive & Export
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-[800px]">
              Historical records of geopolitical anomalies (GDELT z-score &gt; 2.0) and crude spot price volatility surges (EIA Brent 3-day volatility &ge; 10%). Includes verifiable raw payloads.
            </p>
          </div>
          <button
            onClick={handleExportCSV}
            disabled={loading || alerts.length === 0}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold py-3 px-6 rounded-xl border border-purple-400/30 transition-all duration-300 shadow-[0_0_15px_rgba(147,51,234,0.3)] hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            <FileDown className="w-4 h-4" /> Export CSV Archive
          </button>
        </div>
      </GlassCard>

      {/* Main panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Alerts List (Left 7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <h3 className="text-lg font-bold text-slate-300 flex items-center gap-2 px-1">
            Historical Alerts ({alerts.length})
          </h3>

          {loading ? (
            <GlassCard className="h-[600px] flex flex-col items-center justify-center text-center" animate={false} hover={false}>
              <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-400">Fetching assessed threats...</p>
            </GlassCard>
          ) : alerts.length === 0 ? (
            <GlassCard className="h-[600px] flex flex-col items-center justify-center text-center text-slate-400 gap-3" animate={false} hover={false}>
              <Info className="w-8 h-8 text-slate-500" />
              <p>No geopolitical alerts have crossed thresholds yet.</p>
              <p className="text-xs text-slate-500 max-w-[400px]">
                The archive remains honest and only registers events when real GDELT z-scores or price volatility cross the respective thresholds.
              </p>
            </GlassCard>
          ) : (
            <div className="flex flex-col gap-3 h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => setSelectedAlert(alert)}
                  className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer flex items-center justify-between gap-4 ${
                    selectedAlert?.id === alert.id
                      ? "bg-purple-950/20 border-purple-500/80 shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                      : "bg-slate-900/60 hover:bg-slate-800/40 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex gap-4 items-start min-w-0">
                    <div className="mt-1 flex-shrink-0 bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                      {getAlertIcon(alert.alert_type)}
                    </div>
                    <div className="min-w-0 flex flex-col gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border uppercase ${
                          alert.alert_type === "price_volatility"
                            ? "bg-amber-950/30 text-amber-400 border-amber-500/30"
                            : "bg-sky-950/30 text-sky-400 border-sky-500/30"
                        }`}>
                          {alert.alert_type === "price_volatility" ? "Volatility" : "GDELT Z-Score"}
                        </span>
                        <span className="text-slate-400 text-xs flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(alert.triggered_at).toLocaleString()}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-200 mt-1 truncate">
                        {formatCorridor(alert.corridor)}
                      </h4>
                      <p className="text-slate-400 text-xs line-clamp-2 mt-0.5">
                        {alert.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right hidden sm:block">
                      <span className="block text-xs text-slate-500">Value / Thresh</span>
                      <span className="font-mono text-xs font-bold text-slate-300">
                        {alert.value.toFixed(2)} / {alert.threshold.toFixed(1)}
                      </span>
                    </div>
                    <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${
                      selectedAlert?.id === alert.id ? "text-purple-400 translate-x-1" : "text-slate-600"
                    }`} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Verifiable Payload Inspector (Right 5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4 w-full">
          <h3 className="text-lg font-bold text-slate-300 flex items-center gap-2 px-1">
            Verifiable Evidence Payload
          </h3>

          <GlassCard className="p-6 h-[600px] flex flex-col" glowColor="purple" animate={false} hover={false}>
            {selectedAlert ? (
              <div className="flex flex-col h-full min-h-0">
                <div className="border-b border-slate-800 pb-4 mb-4 flex justify-between items-start gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {getAlertIcon(selectedAlert.alert_type)}
                      <span className="text-xs text-slate-400 font-mono">ALERT_ID #{selectedAlert.id}</span>
                    </div>
                    <h4 className="text-base font-bold text-slate-200">
                      {formatCorridor(selectedAlert.corridor)} Alert
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">Trigger Value</span>
                    <span className="font-mono text-sm font-bold text-purple-400">
                      {selectedAlert.value.toFixed(4)}
                    </span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar min-h-0 flex flex-col gap-4 text-xs">
                  {/* Alert summary stats */}
                  <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-semibold">Alert Type</span>
                      <span className="block text-slate-300 font-bold font-mono mt-0.5">
                        {selectedAlert.alert_type}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-semibold">Triggered At</span>
                      <span className="block text-slate-300 font-bold font-mono mt-0.5">
                        {new Date(selectedAlert.triggered_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-semibold">Significance Threshold</span>
                      <span className="block text-slate-300 font-bold font-mono mt-0.5">
                        {selectedAlert.threshold.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-semibold">Verified Source</span>
                      <span className="block text-slate-300 font-bold font-mono mt-0.5">
                        {selectedAlert.alert_type === "price_volatility" ? "EIA API v2 Spot" : "GDELT DOC 2.0"}
                      </span>
                    </div>
                  </div>

                  {/* Raw JSON payload scrollable view */}
                  <div className="flex-1 flex flex-col min-h-[300px]">
                    <span className="text-slate-400 font-semibold mb-1 block">Raw Payload JSON:</span>
                    <div className="flex-1 bg-slate-950 p-4 rounded-lg border border-slate-800/80 overflow-auto font-mono text-slate-300 leading-relaxed shadow-inner max-h-[320px]">
                      {selectedAlert.raw_payload ? (
                        <pre className="text-[11px] whitespace-pre-wrap word-break-all">
                          {JSON.stringify(selectedAlert.raw_payload, null, 2)}
                        </pre>
                      ) : (
                        <div className="flex items-center gap-2 text-slate-500 italic p-4 justify-center h-full">
                          <AlertTriangle className="w-4 h-4 text-amber-500/80" />
                          <span>No payload attached to this alert row (null payload).</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 italic gap-2">
                <Info className="w-6 h-6 text-slate-600" />
                <span>Select an alert to inspect its verifiable payload.</span>
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
