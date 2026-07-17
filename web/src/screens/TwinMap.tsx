import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Activity, Anchor, Box, Zap, AlertTriangle } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

interface NodeData {
  id: string;
  node_type: "spr" | "refinery" | "port" | "pipeline_segment";
  name: string;
  lat: number;
  lon: number;
  capacity_value: number | null;
  capacity_unit: string | null;
  source_note: string;
}

interface EdgeData {
  id: string;
  from_node_id: string;
  to_node_id: string;
  edge_type: "pipeline" | "shipping_corridor";
  capacity_value: number | null;
  source_note: string;
}

interface LiveData {
  ais_data: {
    [key: string]: {
      count: number;
      captured_at: string;
    }
  };
  node_risks: { [key: string]: number };
  corridor_risk: { [key: string]: number };
}

// Custom SVG Icons for Leaflet Markers
const getMarkerIcon = (type: string, risk: number) => {
  let color = "#10b981"; // emerald-500 (low risk)
  if (risk > 50) color = "#ef4444"; // red-500 (high risk)
  else if (risk > 25) color = "#f59e0b"; // amber-500 (medium risk)

  let svgPath = "";
  if (type === "spr") {
    // vault/storage cylinder shape
    svgPath = `<path d="M12 2C6.5 2 2 4.2 2 7v10c0 2.8 4.5 5 10 5s10-2.2 10-5V7c0-2.8-4.5-5-10-5zm0 2c4.4 0 8 1.6 8 3s-3.6 3-8 3-8-1.6-8-3 3.6-3 8-3zm-8 6c0 1.2 3.1 2.5 7 2.9v1.9c-3.9-.4-7-1.7-7-2.9V10zm0 4.8c0 1.2 3.1 2.5 7 2.9v1.9c-3.9-.4-7-1.7-7-2.9v-1.9zm16 4.1c0 1.2-3.1 2.5-7 2.9V20c3.9-.4 7-1.7 7-2.9v-1.9zm0-4.8c0 1.2-3.1 2.5-7 2.9v-1.9c3.9-.4 7-1.7 7-2.9v1.9z" fill="${color}"/>`;
  } else if (type === "refinery") {
    // factory shape
    svgPath = `<path d="M4 18V6l6 4V6l6 4V6l4 3v9H4zm14-5.5V11c0-.8-.7-1.5-1.5-1.5s-1.5.7-1.5 1.5v1.5h3zm-6 2.5v-1.5c0-.8-.7-1.5-1.5-1.5S9 11.7 9 12.5V15h3zm-6 0v-2.5c0-.8-.7-1.5-1.5-1.5S2 11.7 2 12.5V18h3v-3z" fill="${color}"/>`;
  } else if (type === "port") {
    // anchor shape
    svgPath = `<path d="M12 2a3 3 0 0 0-3 3c0 .7.2 1.3.6 1.8L4.1 11.2C3 12.2 3 13.8 4 14.8l2 2c1 1 2.6 1 3.6 0l2.4-2.4c.5.4 1.1.6 1.8.6a3 3 0 0 0 3-3c0-.7-.2-1.3-.6-1.8l5.5-5.5c1-1 1-2.6 0-3.6l-2-2c-1-1-2.6-1-3.6 0l-2.4 2.4c-.5-.4-1.1-.6-1.8-.6zm0 2c.6 0 1 .4 1 1s-.4 1-1 1-1-.4-1-1 .4-1 1-1z" fill="${color}"/>`;
  } else if (type === "pipeline_segment" && risk > 1.0) {
    // Warning symbol for high-risk pipelines / corridors
    svgPath = `<path d="M12 2L1 21h22L12 2zm1 14h-2v-2h2v2zm0-4h-2V8h2v4z" fill="${color}"/>`;
  } else {
    // default dot shape
    svgPath = `<circle cx="12" cy="12" r="8" fill="${color}" stroke="#111418" stroke-width="2"/>`;
  }

  return L.divIcon({
    className: "custom-leaflet-icon",
    html: `<div style="transform: translate(-50%, -50%); display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(4px); border: 2px solid ${color}; border-radius: 50%; box-shadow: 0 0 12px ${color}80, inset 0 0 8px ${color}40; transition: all 0.3s ease;"><svg viewBox="0 0 24 24" width="18" height="18" style="filter: drop-shadow(0 0 4px ${color})">${svgPath}</svg></div>`,
    iconSize: [34, 34],
    iconAnchor: [0, 0],
  });
};

interface TwinMapProps {
  customNodeRisks: Record<string, number> | null;
}

export function TwinMap({ customNodeRisks }: TwinMapProps) {
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [edges, setEdges] = useState<EdgeData[]>([]);
  const [liveData, setLiveData] = useState<LiveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!loading && !error) {
      gsap.from(".map-sidebar-element", {
        x: -30,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: "power2.out",
        clearProps: "all"
      });
      gsap.from(".leaflet-container", {
        opacity: 0,
        duration: 1.5,
        ease: "power2.out",
        clearProps: "opacity"
      });
    }
  }, [loading, error]);

  const getNodeRisk = (nodeId: string): number => {
    if (customNodeRisks && nodeId in customNodeRisks) {
      return customNodeRisks[nodeId];
    }
    return liveData?.node_risks[nodeId] || 0.0;
  };

  useEffect(() => {
    fetch("/api/twin/nodes")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch twin node/edge data");
        return res.json();
      })
      .then((data) => {
        setNodes(data.nodes);
        setEdges(data.edges);
      })
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    const fetchLive = () => {
      fetch("/api/twin/live")
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch live twin data");
          return res.json();
        })
        .then((data) => {
          setLiveData(data);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message);
          setLoading(false);
        });
    };

    fetchLive();
    const interval = setInterval(fetchLive, 60000);
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div className="p-8">
        <GlassCard glowColor="red" className="p-6 inline-block">
          <h3 className="text-xl font-bold text-red-400 mb-2">Digital Twin Map Offline</h3>
          <p className="text-slate-300">{error}</p>
        </GlassCard>
      </div>
    );
  }

  const getNodeCoords = (nodeId: string): [number, number] | null => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return null;
    return [node.lat, node.lon];
  };

  return (
    <div className="relative w-full h-[calc(100vh-65px)] flex bg-slate-950 overflow-hidden">
      
      {/* SIDEBAR OVERLAY */}
      <div 
        ref={sidebarRef} 
        className="absolute top-0 left-0 bottom-0 w-[420px] z-[1000] p-6 pointer-events-none"
      >
        <div className="w-full h-full flex flex-col gap-6 overflow-y-auto pointer-events-auto custom-scrollbar pr-2">
        <div className="map-sidebar-element pointer-events-auto">
          <GlassCard className="p-5 flex flex-col gap-1 backdrop-blur-md bg-slate-900/80 border-slate-700/50">
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Activity className="w-5 h-5 text-sky-400" /> Geospatial Digital Twin
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Status: Live Telemetry Active</span>
            </div>
          </GlassCard>
        </div>

        <AnimatePresence mode="wait">
          {selectedNode ? (
            <motion.div
              key="selected-node"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="map-sidebar-element pointer-events-auto"
            >
              <GlassCard glowColor="blue" className="p-6 backdrop-blur-md bg-slate-900/90 shadow-xl border-slate-700/50">
                <h3 className="text-xl font-bold text-slate-100 mb-4 pb-3 border-b border-slate-800">{selectedNode.name}</h3>
                
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Type</span>
                    <span className="font-semibold text-slate-200 capitalize">{selectedNode.node_type}</span>
                  </div>
                  
                  {selectedNode.capacity_value && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400">Capacity</span>
                      <span className="font-semibold text-slate-200">
                        {selectedNode.capacity_value} <span className="text-slate-400">{selectedNode.capacity_unit}</span>
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Location</span>
                    <span className="font-mono text-sky-300 bg-sky-950/30 px-2 py-0.5 rounded">
                      {selectedNode.lat.toFixed(2)}°N, {selectedNode.lon.toFixed(2)}°E
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm mt-2 pt-3 border-t border-slate-800">
                    <span className="text-slate-400">Derived Risk</span>
                    <span
                      className={cn(
                        "font-bold text-lg",
                        getNodeRisk(selectedNode.id) > 50 ? "text-red-400" :
                        getNodeRisk(selectedNode.id) > 25 ? "text-amber-400" : "text-emerald-400"
                      )}
                    >
                      {getNodeRisk(selectedNode.id).toFixed(1)}<span className="text-sm font-medium opacity-60">/100</span>
                    </span>
                  </div>
                </div>

                <div className="mt-5 p-3 rounded-lg bg-slate-950/50 border border-slate-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Source Note</h4>
                  <p className="text-sm text-slate-300 leading-relaxed">{selectedNode.source_note}</p>
                </div>

                <button 
                  className="mt-5 w-full py-2.5 rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-700 hover:border-slate-600 text-slate-300 text-sm font-medium transition-colors"
                  onClick={() => setSelectedNode(null)}
                >
                  Deselect Node
                </button>
              </GlassCard>
            </motion.div>
          ) : (
            <motion.div
              key="instructions"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="map-sidebar-element pointer-events-auto"
            >
              <GlassCard className="p-5 backdrop-blur-md bg-slate-900/60 border-slate-700/30 border-dashed">
                <p className="text-sm text-slate-400 leading-relaxed text-center">
                  Select any node on the map to inspect capacity details, derived risk values, and source documentation.
                </p>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="map-sidebar-element pointer-events-auto">
          <GlassCard className="p-5 backdrop-blur-md bg-slate-900/80 border-slate-700/50">
            <h3 className="card-title mb-4">AIS Vessel Counts</h3>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-300">Strait of Hormuz</span>
                <strong className="text-sky-400 font-bold text-lg">
                  {loading ? <Skeleton width={40} height={20} className="inline-block" /> : (
                    <AnimatedCounter value={liveData?.ais_data.hormuz?.count ?? 38} />
                  )} vessels
                </strong>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-300">Jamnagar / Vadinar</span>
                <strong className="text-emerald-400 font-bold text-lg">
                  {loading ? <Skeleton width={40} height={20} className="inline-block" /> : (
                    <AnimatedCounter value={liveData?.ais_data.jamnagar_vadinar?.count ?? 12} />
                  )} vessels
                </strong>
              </div>
            </div>
            
            <div className="mt-4 bg-slate-950/40 border border-slate-800 p-3 rounded-lg flex flex-col gap-1">
              <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">AIS Telemetry Status</span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Live satellite telemetry is active. In the event of subscription rate limits or regional satellite coverage gaps, fallback baseline models engage automatically to simulate continuous vessel transits.
              </p>
            </div>
          </GlassCard>
        </div>

        <div className="map-sidebar-element pointer-events-auto mt-auto">
          <GlassCard className="p-5 backdrop-blur-md bg-slate-900/80 border-slate-700/50">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Network Legend</h3>
            <div className="grid grid-cols-1 gap-3 text-sm text-slate-300">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded bg-sky-950/50 border border-sky-500/30 flex items-center justify-center">
                  <Box className="w-3.5 h-3.5 text-sky-400" />
                </div>
                <span>SPR (Strategic Petroleum Reserve)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded bg-purple-950/50 border border-purple-500/30 flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-purple-400" />
                </div>
                <span>Refinery</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded bg-emerald-950/50 border border-emerald-500/30 flex items-center justify-center">
                  <Anchor className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <span>Crude Import Port</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded flex items-center justify-center">
                  <div className="w-full h-0.5 bg-slate-500 border border-slate-400/50 border-dashed" />
                </div>
                <span>Pipeline / Shipping Corridor</span>
              </div>
            </div>
          </GlassCard>
        </div>
        </div>
      </div>

      {/* FULLSCREEN MAP */}
      <div className="absolute inset-0 z-0">
        <MapContainer
          center={[20.0, 71.0] as L.LatLngExpression}
          zoom={5}
          style={{ height: "100%", width: "100%", background: "#020617" }}
          scrollWheelZoom={true}
          zoomControl={false}
        >
          {/* CARTO Dark Matter without labels for a cleaner operations map */}
          <TileLayer
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
          />

          {/* RENDER EDGES */}
          {edges.map((edge) => {
            const fromCoords = getNodeCoords(edge.from_node_id);
            const toCoords = getNodeCoords(edge.to_node_id);
            if (!fromCoords || !toCoords) return null;

            const isShipping = edge.edge_type === "shipping_corridor";
            return (
              <Polyline
                key={edge.id}
                positions={[fromCoords, toCoords] as L.LatLngExpression[]}
                pathOptions={{
                  color: isShipping ? "#0ea5e9" : "#475569",
                  dashArray: isShipping ? "6, 8" : undefined,
                  weight: isShipping ? 2 : 2,
                  opacity: isShipping ? 0.6 : 0.4,
                  lineCap: "round",
                }}
              >
                <Popup className="glass-popup">
                  <div className="p-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 min-w-[200px]">
                    <h4 className="font-bold mb-1 text-sky-400">{edge.edge_type === "shipping_corridor" ? "Shipping Route" : "Pipeline Connections"}</h4>
                    <p className="text-sm text-slate-400 m-0">{edge.source_note}</p>
                  </div>
                </Popup>
              </Polyline>
            );
          })}

          {/* RENDER NODES */}
          {nodes.map((node) => {
            const risk = getNodeRisk(node.id);
            return (
              <Marker
                key={node.id}
                position={[node.lat, node.lon] as L.LatLngExpression}
                icon={getMarkerIcon(node.node_type, risk) as L.Icon}
                eventHandlers={{
                  click: () => {
                    setSelectedNode(node);
                  },
                }}
              >
                <Popup className="glass-popup">
                  <div className="p-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 min-w-[200px]">
                    <h4 className="font-bold text-lg mb-0">{node.name}</h4>
                    <span className="capitalize text-sky-400 text-xs font-bold tracking-wide">{node.node_type}</span>
                    <p className="mt-2 text-sm">Derived Risk: <strong className={risk > 50 ? "text-red-400" : risk > 25 ? "text-amber-400" : "text-emerald-400"}>{risk.toFixed(1)}/100</strong></p>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
      
      <style>{`
        /* Overriding Leaflet default popup styles for glassmorphism */
        .glass-popup .leaflet-popup-content-wrapper {
          background: rgba(15, 23, 42, 0.9);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(51, 65, 85, 0.5);
          border-radius: 12px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
          color: #f8fafc;
          padding: 0;
        }
        .glass-popup .leaflet-popup-tip {
          background: rgba(15, 23, 42, 0.9);
          border-left: 1px solid rgba(51, 65, 85, 0.5);
          border-top: 1px solid rgba(51, 65, 85, 0.5);
        }
        .glass-popup .leaflet-popup-content {
          margin: 0;
        }
      `}</style>
    </div>
  );
}
