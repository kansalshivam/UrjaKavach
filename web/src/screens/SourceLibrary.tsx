import React, { useState, useEffect, useRef } from "react";
import { ScrollProgress } from "../components/motion/ScrollProgress";
import { GlassCard } from "@/components/ui/GlassCard";
import { ShimmerButton } from "@/components/ui/ShimmerButton";
import { Skeleton } from "@/components/ui/Skeleton";
import { Library, AlertTriangle, MessageSquare, Send, BookOpen, Search, ArrowRight } from "lucide-react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { cn } from "@/lib/utils";

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

  const containerRef = useRef<HTMLDivElement>(null);
  const docContainerRef = useRef<HTMLDivElement>(null);
  const qaContainerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.from(".lib-fade", {
      y: 20,
      opacity: 0,
      duration: 0.6,
      stagger: 0.1,
      ease: "power2.out",
      clearProps: "all"
    });
  }, { scope: containerRef });

  // Animate new answers
  useGSAP(() => {
    if (answer && qaContainerRef.current) {
      gsap.from(qaContainerRef.current, {
        y: 10,
        opacity: 0,
        duration: 0.4,
        ease: "power2.out"
      });
    }
  }, [answer]);

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
    <div ref={containerRef} className="p-6 md:p-10 max-w-[95%] xl:max-w-[1800px] mx-auto flex flex-col gap-6 w-full">
      {/* Header Banner */}
      <GlassCard className="lib-fade p-8" glowColor="blue" animate={false}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="section-header mb-2 flex items-center gap-2">
              <Library className="w-5 h-5" /> Synthetic Reference Library
            </h2>
            <h1 className="text-3xl font-bold text-slate-100 tracking-tight">
              Reference Model Specifications Library
            </h1>
            <p className="text-slate-400 mt-2 max-w-2xl text-lg">
              Explore and query the reference specifications and mathematical modeling parameters governing the Urja Kavach simulator.
            </p>
          </div>
        </div>
      </GlassCard>

      {/* High-visibility Persistent Disclosure Banner */}
      <div className="lib-fade bg-amber-500/10 border border-amber-500/20 p-5 rounded-xl flex gap-4 items-start relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <strong className="block text-amber-500 font-bold mb-2">
            Urja Kavach Reference Data Model Disclosure
          </strong>
          <p className="text-sm text-amber-100/70 leading-relaxed m-0">
            This library contains synthetic reference specifications and modeling constants constructed solely to ensure internal numeric consistency with the scenario simulator parameters and the project dossier. These are not real-time retrieved or live government publications.
          </p>
        </div>
      </div>

      {/* Main Two-column Layout */}
      <div className="lib-fade grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[500px]">
        {/* Left Column: Curated Library Panel (Scrollable with ScrollProgress) */}
        <GlassCard className="flex flex-col overflow-hidden h-[600px] relative" animate={false}>
          {/* Scroll progress bar tracking library document list reading progress */}
          <ScrollProgress containerRef={docContainerRef as any} />

          <div className="p-5 border-b border-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-sky-500/20 flex items-center justify-center text-sky-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 leading-tight">Specifications Corpus</h2>
              <p className="text-xs text-slate-500">Scroll through reference specs.</p>
            </div>
          </div>

          <div
            ref={docContainerRef}
            className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 custom-scrollbar"
          >
            {loadingDocs ? (
              <div className="flex flex-col gap-4">
                {[1,2,3].map(i => (
                  <div key={i} className="p-4 rounded-lg bg-slate-800/30 border border-slate-800">
                    <div className="flex justify-between mb-3"><Skeleton width={100} height={16} /><Skeleton width={80} height={16} /></div>
                    <Skeleton width="80%" height={24} className="mb-2" />
                    <Skeleton width="100%" height={40} />
                  </div>
                ))}
              </div>
            ) : (
              documents.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => handleSelectDoc(doc.id)}
                  className={cn(
                    "p-5 rounded-xl border transition-all cursor-pointer group",
                    selectedDocId === doc.id 
                      ? "bg-sky-500/10 border-sky-500/30 shadow-[0_0_15px_rgba(14,165,233,0.1)]" 
                      : "bg-slate-900/50 border-slate-800 hover:bg-slate-800/80 hover:border-slate-700"
                  )}
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-sky-400 bg-sky-950/50 px-2 py-0.5 rounded">{doc.id}</span>
                    <span className="text-xs font-medium text-slate-500">{doc.date}</span>
                  </div>
                  <h3 className={cn(
                    "text-lg font-bold mb-2 transition-colors",
                    selectedDocId === doc.id ? "text-sky-300" : "text-slate-100 group-hover:text-sky-200"
                  )}>
                    {doc.title}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed mb-3">
                    {doc.summary}
                  </p>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-600" /> Source: {doc.source}
                  </div>

                  {selectedDocId === doc.id && selectedDoc && (
                    <div className="mt-5 pt-5 border-t border-sky-900/30">
                      <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line font-mono bg-slate-950/50 p-4 rounded-lg border border-slate-800/80 shadow-inner">
                        {selectedDoc.content}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </GlassCard>

        {/* Right Column: Q&A Engine Client */}
        <GlassCard className="flex flex-col overflow-hidden h-[600px]" animate={false}>
          <div className="p-5 border-b border-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 leading-tight">Model Q&A Client</h2>
              <p className="text-xs text-slate-500">Extract parameters from the corpus.</p>
            </div>
          </div>

          {/* Answer Display */}
          <div className="flex-1 bg-slate-950/80 p-6 overflow-y-auto custom-scrollbar flex flex-col justify-end relative shadow-inner">
            {loadingQuery ? (
              <div className="flex flex-col gap-3 max-w-[85%] mr-auto">
                <div className="flex items-center gap-3 text-sm font-medium text-sky-400 mb-2">
                  <Search className="w-4 h-4 animate-pulse" /> Retrieving context...
                </div>
                <div className="bg-slate-800/80 rounded-2xl rounded-tl-sm p-4 border border-slate-700 animate-pulse">
                  <Skeleton width="100%" height={16} className="mb-2" />
                  <Skeleton width="90%" height={16} className="mb-2" />
                  <Skeleton width="75%" height={16} />
                </div>
              </div>
            ) : answer ? (
              <div ref={qaContainerRef} className="flex flex-col gap-4 w-full">
                {/* User query bubble */}
                <div className="self-end max-w-[85%] bg-sky-600 text-white p-4 rounded-2xl rounded-tr-sm shadow-md">
                  <p className="text-sm m-0">{query}</p>
                </div>
                
                {/* System answer bubble */}
                <div className="self-start max-w-[90%] bg-slate-800 border border-slate-700 p-5 rounded-2xl rounded-tl-sm shadow-md">
                  {retrievedDocs.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 mb-4 pb-3 border-b border-slate-700/50">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <ArrowRight className="w-3 h-3" /> Citations:
                      </span>
                      {retrievedDocs.map((docId) => (
                        <button
                          key={docId}
                          onClick={() => handleSelectDoc(docId)}
                          className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-1 rounded hover:bg-amber-500/20 transition-colors"
                        >
                          {docId}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                    {answer}
                  </div>
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 p-8 text-center opacity-50">
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                  <MessageSquare className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-300 mb-2">Knowledge Engine Ready</h3>
                <p className="text-sm max-w-sm">Ask a question to search policy publications and extract exact modeling parameters.</p>
              </div>
            )}
          </div>

          {/* Query Form */}
          <div className="p-4 bg-slate-900 border-t border-slate-800">
            <form onSubmit={handleQuerySubmit} className="flex gap-3">
              <input
                type="text"
                placeholder="e.g. What is the fill level of the caverns?"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all shadow-inner"
              />
              <ShimmerButton
                type="submit"
                aria-label="Query"
                disabled={loadingQuery || !query.trim()}
                className="px-6 rounded-lg"
              >
                <Send className="w-4 h-4" />
              </ShimmerButton>
            </form>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
