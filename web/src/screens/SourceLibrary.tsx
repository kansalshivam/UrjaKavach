import React, { useState, useEffect, useRef } from "react";
import { ScrollProgress } from "../components/motion/ScrollProgress";

interface DocumentMetadata {
  id: string;
  title: string;
  source: string;
  date: string;
  summary: string;
}

interface DocumentDetail {
  id: string;
  title: string;
  source: string;
  date: string;
  content: string;
}

export function SourceLibrary() {
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<DocumentDetail | null>(null);
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [retrievedDocs, setRetrievedDocs] = useState<string[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [loadingQuery, setLoadingQuery] = useState(false);

  // Ref for scroll progress integration
  const docContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/rag/documents")
      .then((res) => res.json())
      .then((data) => {
        setDocuments(data);
        if (data.length > 0) {
          handleSelectDoc(data[0].id);
        }
        setLoadingDocs(false);
      })
      .catch((err) => {
        console.error("Failed to load documents", err);
        setLoadingDocs(false);
      });
  }, []);

  const handleSelectDoc = (id: string) => {
    setSelectedDocId(id);
    fetch(`/api/rag/documents/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setSelectedDoc(data);
      })
      .catch((err) => console.error("Failed to load doc detail", err));
  };

  const handleQuerySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoadingQuery(true);
    setAnswer(null);
    setRetrievedDocs([]);

    fetch("/api/rag/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    })
      .then((res) => res.json())
      .then((data) => {
        setAnswer(data.answer);
        setRetrievedDocs(data.retrieved_documents || []);
        setLoadingQuery(false);
      })
      .catch((err) => {
        console.error("Failed to run Q&A query", err);
        setLoadingQuery(false);
      });
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        height: "100%",
        padding: "24px",
        background: "#0b0f19",
        color: "#f8fafc",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Header Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)",
          border: "1px solid #312e81",
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
        }}
      >
        <span style={{ fontSize: "0.75rem", background: "rgba(99, 102, 241, 0.1)", color: "#818cf8", padding: "4px 10px", borderRadius: "9999px", fontWeight: 600 }}>
          Synthetic Reference Library
        </span>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, margin: "8px 0 4px", color: "#f8fafc" }}>
          Reference Model Specifications Library
        </h1>
        <p style={{ fontSize: "0.9rem", color: "#94a3b8", margin: 0 }}>
          Explore and query the reference specifications and mathematical modeling parameters governing the Urja Kavach simulator.
        </p>
      </div>

      {/* High-visibility Persistent Disclosure Banner */}
      <div
        style={{
          borderLeft: "4px solid #f59e0b",
          background: "rgba(245, 158, 11, 0.05)",
          padding: "16px 20px",
          borderRadius: "0 8px 8px 0",
          fontSize: "0.85rem",
          color: "#d97706",
          lineHeight: "1.5",
          border: "1px solid rgba(245, 158, 11, 0.15)",
        }}
      >
        <strong style={{ color: "#f59e0b", display: "block", marginBottom: "4px", fontSize: "0.9rem" }}>
          ⚠️ Urja Kavach Reference Data Model Disclosure
        </strong>
        This library contains synthetic reference specifications and modeling constants constructed solely to ensure internal numeric consistency with the scenario simulator parameters and the project dossier. These are not real-time retrieved or live government publications.
      </div>

      {/* Main Two-column Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", height: "calc(100vh - 380px)" }}>
        {/* Left Column: Curated Library Panel (Scrollable with ScrollProgress) */}
        <div
          style={{
            background: "#0f172a",
            border: "1px solid #1e293b",
            borderRadius: "12px",
            display: "flex",
            flexDirection: "column",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Scroll progress bar tracking library document list reading progress */}
          <ScrollProgress containerRef={docContainerRef as any} />

          <div style={{ padding: "16px", borderBottom: "1px solid #1e293b" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>Reference Model Specifications</h2>
            <p style={{ fontSize: "0.75rem", color: "#64748b", margin: "4px 0 0" }}>
              Scroll through reference specs. Progress tracker is active at the top.
            </p>
          </div>

          <div
            ref={docContainerRef}
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            {loadingDocs ? (
              <div style={{ color: "#64748b" }}>Loading source publications...</div>
            ) : (
              documents.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => handleSelectDoc(doc.id)}
                  style={{
                    padding: "16px",
                    background: selectedDocId === doc.id ? "rgba(56, 189, 248, 0.05)" : "#0b0f19",
                    border: selectedDocId === doc.id ? "1px solid #38bdf8" : "1px solid #1e293b",
                    borderRadius: "8px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontSize: "0.75rem", color: "#38bdf8", fontWeight: 600 }}>{doc.id}</span>
                    <span style={{ fontSize: "0.75rem", color: "#64748b" }}>{doc.date}</span>
                  </div>
                  <h3 style={{ fontSize: "0.95rem", fontWeight: 700, margin: "0 0 6px", color: selectedDocId === doc.id ? "#38bdf8" : "#f8fafc" }}>
                    {doc.title}
                  </h3>
                  <p style={{ fontSize: "0.8rem", color: "#94a3b8", margin: "0 0 8px", lineHeight: "1.4" }}>
                    {doc.summary}
                  </p>
                  <span style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600 }}>
                    Source: {doc.source}
                  </span>

                  {selectedDocId === doc.id && selectedDoc && (
                    <div
                      style={{
                        marginTop: "16px",
                        paddingTop: "16px",
                        borderTop: "1px dashed #1e293b",
                        fontSize: "0.85rem",
                        color: "#e2e8f0",
                        lineHeight: "1.5",
                        whiteSpace: "pre-line",
                      }}
                    >
                      {selectedDoc.content}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Q&A Engine Client */}
        <div
          style={{
            background: "#0f172a",
            border: "1px solid #1e293b",
            borderRadius: "12px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            overflow: "hidden",
          }}
        >
          <div style={{ borderBottom: "1px solid #1e293b", paddingBottom: "12px" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>Reference Model Q&A Client</h2>
            <p style={{ fontSize: "0.75rem", color: "#64748b", margin: "4px 0 0" }}>
              Query the specifications corpus to extract parameters and modeling references.
            </p>
          </div>

          {/* Answer Display */}
          <div
            style={{
              flex: 1,
              background: "#0b0f19",
              border: "1px solid #1e293b",
              borderRadius: "8px",
              padding: "16px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {loadingQuery ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", color: "#64748b", fontSize: "0.9rem" }}>
                <span>Retrieving relevant policy documents...</span>
                <span>Synthesizing answer using LLM Fallback chain...</span>
              </div>
            ) : answer ? (
              <div style={{ fontSize: "0.9rem", lineHeight: "1.6", color: "#cbd5e1" }}>
                {/* Source citation cards */}
                {retrievedDocs.length > 0 && (
                  <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "0.75rem", color: "#64748b", alignSelf: "center", fontWeight: 600 }}>
                      Retrieved Context:
                    </span>
                    {retrievedDocs.map((docId) => (
                      <span
                        key={docId}
                        onClick={() => handleSelectDoc(docId)}
                        style={{
                          fontSize: "0.75rem",
                          background: "rgba(245, 158, 11, 0.1)",
                          color: "#f59e0b",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          border: "1px solid rgba(245, 158, 11, 0.3)",
                          cursor: "pointer",
                          fontWeight: 600,
                        }}
                      >
                        {docId}
                      </span>
                    ))}
                  </div>
                )}
                
                <div style={{ whiteSpace: "pre-line" }}>{answer}</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#475569" }}>
                <span style={{ fontSize: "2rem", marginBottom: "8px" }}>💬</span>
                <span style={{ fontSize: "0.85rem" }}>Ask a question to search policy publications.</span>
              </div>
            )}
          </div>

          {/* Query Form */}
          <form onSubmit={handleQuerySubmit} style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              placeholder="e.g. What is the fill level of the caverns?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                flex: 1,
                background: "#0b0f19",
                border: "1px solid #1e293b",
                borderRadius: "6px",
                padding: "10px 14px",
                color: "#f8fafc",
                fontSize: "0.85rem",
                outline: "none",
              }}
            />
            <button
              type="submit"
              disabled={loadingQuery}
              style={{
                background: "#0284c7",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                padding: "10px 18px",
                fontWeight: 600,
                fontSize: "0.85rem",
                cursor: "pointer",
                transition: "background 0.2s",
              }}
            >
              Query
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
