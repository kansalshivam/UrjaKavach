import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { SpriteIcon, RefineryIcon, PortIcon, PipelineIcon } from "../components/icons/Iconsax.tsx";

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
    html: `<div class="marker-wrapper" style="transform: translate(-50%, -50%); display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; background: rgba(17, 20, 24, 0.7); border: 2px solid ${color}; border-radius: 50%; box-shadow: 0 0 8px ${color}"><svg viewBox="0 0 24 24" width="20" height="20">${svgPath}</svg></div>`,
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

  const getNodeRisk = (nodeId: string): number => {
    if (customNodeRisks && nodeId in customNodeRisks) {
      return customNodeRisks[nodeId];
    }
    return liveData?.node_risks[nodeId] || 0.0;
  };

  // 1. Fetch static nodes and edges on mount
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

  // 2. Fetch and poll live risk/AIS data every 60s
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
      <div className="error-panel">
        <h3>Digital Twin Map Offline</h3>
        <p>{error}</p>
      </div>
    );
  }

  // Find coordinates by node ID helper
  const getNodeCoords = (nodeId: string): [number, number] | null => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return null;
    return [node.lat, node.lon];
  };

  return (
    <div className="twin-container">
      <div className="twin-sidebar">
        <div className="sidebar-header">
          <h2>Geospatial Digital Twin</h2>
          <span className="badge">Status: Live Polling (60s)</span>
        </div>

        {/* Selected Node Details Panel */}
        {selectedNode ? (
          <div className="detail-card">
            <h3>{selectedNode.name}</h3>
            <div className="detail-row">
              <span className="label">Type</span>
              <span className="value capitalize">{selectedNode.node_type}</span>
            </div>
            {selectedNode.capacity_value && (
              <div className="detail-row">
                <span className="label">Capacity</span>
                <span className="value">
                  {selectedNode.capacity_value} {selectedNode.capacity_unit}
                </span>
              </div>
            )}
            <div className="detail-row">
              <span className="label">Location</span>
              <span className="value font-mono">
                {selectedNode.lat.toFixed(2)}°N, {selectedNode.lon.toFixed(2)}°E
              </span>
            </div>
            <div className="detail-row">
              <span className="label">Derived Risk</span>
              <span
                className="value font-bold"
                style={{
                  color:
                    getNodeRisk(selectedNode.id) > 50
                      ? "#ef4444"
                      : getNodeRisk(selectedNode.id) > 25
                        ? "#f59e0b"
                        : "#10b981",
                }}
              >
                {getNodeRisk(selectedNode.id).toFixed(1)}/100
              </span>
            </div>
            <div className="source-note">
              <h4>Source Note</h4>
              <p>{selectedNode.source_note}</p>
            </div>
            <button className="btn-close" onClick={() => setSelectedNode(null)}>
              Deselect
            </button>
          </div>
        ) : (
          <div className="instructions-card">
            <p>Select any node on the map to inspect capacity details, derived risk values, and source documentation.</p>
          </div>
        )}

        {/* Live AIS Vessel Density Bounding Box Overlay Card */}
        <div className="vessel-card">
          <h3>AIS Vessel Counts</h3>
          <div className="detail-row">
            <span>Strait of Hormuz</span>
            <strong>{loading ? "..." : liveData?.ais_data.hormuz?.count ?? 38} vessels</strong>
          </div>
          <div className="detail-row">
            <span>Jamnagar / Vadinar</span>
            <strong>{loading ? "..." : liveData?.ais_data.jamnagar_vadinar?.count ?? 12} vessels</strong>
          </div>
          <div className="notes">
            {liveData?.ais_data.hormuz?.count === 38 && (
              <div className="warning-banner" style={{ marginTop: "12px", background: "rgba(245, 158, 11, 0.1)", border: "1px solid #f59e0b", padding: "8px", borderRadius: "4px", fontSize: "0.8rem", color: "#f59e0b" }}>
                ⚠️ <strong>AIS stream disconnected.</strong> Showing golden fallback snapshot (38 vessels at Hormuz, 12 at Jamnagar/Vadinar) captured at {new Date(liveData?.ais_data.hormuz?.captured_at || "2026-07-14T11:14:23.493171+00:00").toLocaleString()}.
              </div>
            )}
          </div>
        </div>

        {/* Map Legend */}
        <div className="legend-card">
          <h3>Network Legend</h3>
          <div className="legend-item" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <SpriteIcon size={16} color="#38bdf8" />
            <span>SPR (Strategic Petroleum Reserve)</span>
          </div>
          <div className="legend-item" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <RefineryIcon size={16} color="#a855f7" />
            <span>Refinery</span>
          </div>
          <div className="legend-item" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <PortIcon size={16} color="#10b981" />
            <span>Crude Import Port</span>
          </div>
          <div className="legend-item" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <PipelineIcon size={16} color="#8b949e" />
            <span>Pipeline Node / Shipping Corridor</span>
          </div>
        </div>
      </div>

      <div className="map-view">
        <MapContainer
          center={[20.0, 71.0] as L.LatLngExpression}
          zoom={5}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={true}
        >
          {/* Using CARTO Dark Matter for a dark premium operations console vibe */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
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
                  color: isShipping ? "#0ea5e9" : "#4b5563",
                  dashArray: isShipping ? "6, 6" : undefined,
                  weight: isShipping ? 3 : 2,
                  opacity: 0.7,
                }}
              >
                <Popup>
                  <div className="popup-card">
                    <h4>{edge.edge_type === "shipping_corridor" ? "Shipping Route" : "Pipeline Connections"}</h4>
                    <p>{edge.source_note}</p>
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
                <Popup>
                  <div className="popup-card">
                    <h4>{node.name}</h4>
                    <span className="capitalize text-gray-400 text-xs">{node.node_type}</span>
                    <p className="font-bold mt-1">Derived Risk: {risk.toFixed(1)}/100</p>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
