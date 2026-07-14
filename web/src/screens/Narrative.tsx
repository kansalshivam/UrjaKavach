import { useEffect, useState } from "react";

export function Narrative() {
  const [narrativeText, setNarrativeText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNarrative = () => {
    setLoading(true);
    fetch("/api/narrative")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch risk briefing narrative");
        return res.json();
      })
      .then((data) => {
        setNarrativeText(data.narrative);
        setError(null);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchNarrative();
  }, []);

  // Basic custom markdown parser to convert the narrative text into React elements safely
  const renderMarkdown = (text: string) => {
    return text.split("\n").map((line, idx) => {
      const trimmed = line.trim();

      // Headers
      if (trimmed.startsWith("###")) {
        return (
          <h3 key={idx} style={{ color: "#38bdf8", marginTop: "16px", marginBottom: "8px", fontSize: "1.1rem" }}>
            {trimmed.replace("###", "").trim()}
          </h3>
        );
      }
      if (trimmed.startsWith("####")) {
        return (
          <h4 key={idx} style={{ color: "#94a3b8", marginTop: "12px", marginBottom: "6px", fontSize: "0.95rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {trimmed.replace("####", "").trim()}
          </h4>
        );
      }

      // Bold lists
      if (trimmed.startsWith("- **")) {
        // e.g. - **Hormuz**: 22.2/100 (Details)
        const content = trimmed.substring(2).trim();
        const boldEndIndex = content.indexOf("**: ");
        if (boldEndIndex !== -1) {
          const boldPart = content.substring(2, boldEndIndex);
          const restPart = content.substring(boldEndIndex + 4);
          return (
            <li key={idx} style={{ marginLeft: "16px", marginBottom: "6px", fontSize: "0.9rem", color: "#c9d1d9" }}>
              <strong style={{ color: "#f1f5f9" }}>{boldPart}</strong>: {restPart}
            </li>
          );
        }
      }

      // Standard lists
      if (trimmed.startsWith("- ")) {
        const content = trimmed.substring(2).trim();
        // Check for link pattern: [Text](Url)
        const linkMatch = content.match(/\[(.*?)\]\((.*?)\)(.*)/);
        if (linkMatch) {
          const [, linkText, linkUrl, restText] = linkMatch;
          return (
            <li key={idx} style={{ marginLeft: "16px", marginBottom: "6px", fontSize: "0.9rem", color: "#c9d1d9" }}>
              <a href={linkUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#38bdf8", textDecoration: "none" }}>
                {linkText}
              </a>
              {restText}
            </li>
          );
        }
        return (
          <li key={idx} style={{ marginLeft: "16px", marginBottom: "6px", fontSize: "0.9rem", color: "#c9d1d9" }}>
            {content}
          </li>
        );
      }

      // Bold text line
      if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
        return (
          <p key={idx} style={{ fontWeight: 600, fontSize: "0.95rem", margin: "8px 0", color: "#f1f5f9" }}>
            {trimmed.replace(/\*\*/g, "")}
          </p>
        );
      }
      if (trimmed.includes("**")) {
        // Simple inline bolding
        const parts = trimmed.split("**");
        return (
          <p key={idx} style={{ fontSize: "0.9rem", lineHeight: "1.5", margin: "8px 0", color: "#c9d1d9" }}>
            {parts.map((part, pidx) => pidx % 2 === 1 ? <strong key={pidx} style={{ color: "#f1f5f9" }}>{part}</strong> : part)}
          </p>
        );
      }

      // Empty line
      if (trimmed === "") {
        return <div key={idx} style={{ height: "8px" }} />;
      }

      // Standard paragraph
      return (
        <p key={idx} style={{ fontSize: "0.9rem", lineHeight: "1.5", margin: "8px 0", color: "#c9d1d9" }}>
          {trimmed}
        </p>
      );
    });
  };

  return (
    <div className="narrative-view" style={{ padding: "32px", height: "100%", overflowY: "auto" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h2 className="eyebrow" style={{ color: "#38bdf8", margin: 0 }}>Executive Intelligence</h2>
            <h1 style={{ fontSize: "2rem", margin: "4px 0 0" }}>Strategic Risk Narrative</h1>
          </div>
          <button
            className="btn-close"
            style={{ width: "auto", padding: "8px 16px" }}
            onClick={fetchNarrative}
            disabled={loading}
          >
            {loading ? "Generating..." : "Regenerate Briefing"}
          </button>
        </div>

        {loading ? (
          <div className="detail-card" style={{ padding: "32px", textAlign: "center", color: "#8b949e" }}>
            <p>Synthesizing GDELT news flows, price signals, and vessel densities into a strategic narrative...</p>
          </div>
        ) : error ? (
          <div className="error-panel">
            <h3>Narrative Service Offline</h3>
            <p>{error}</p>
          </div>
        ) : (
          <div
            className="detail-card"
            style={{
              background: "#161b22",
              border: "1px solid #21262d",
              borderRadius: "12px",
              padding: "32px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
            }}
          >
            <div className="markdown-content">{renderMarkdown(narrativeText)}</div>
          </div>
        )}
      </div>
    </div>
  );
}
