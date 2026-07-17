import { useEffect, useState, useRef } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { ShimmerButton } from "@/components/ui/ShimmerButton";
import { Skeleton } from "@/components/ui/Skeleton";
import { FileText, RefreshCw, AlertTriangle } from "lucide-react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

export function Narrative() {
  const [narrativeText, setNarrativeText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.from(".narrative-fade", {
      y: 20,
      opacity: 0,
      duration: 0.6,
      stagger: 0.1,
      ease: "power2.out",
      clearProps: "all"
    });
  }, { scope: containerRef });

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
      if (trimmed.startsWith("### ")) {
        return (
          <h3 key={idx} className="text-xl font-bold text-sky-400 mt-6 mb-3">
            {trimmed.replace("### ", "").trim()}
          </h3>
        );
      }
      if (trimmed.startsWith("#### ")) {
        return (
          <h4 key={idx} className="text-sm font-bold text-slate-400 mt-5 mb-2 uppercase tracking-wider">
            {trimmed.replace("#### ", "").trim()}
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
            <li key={idx} className="ml-4 mb-2 text-slate-300 leading-relaxed relative pl-2 before:content-[''] before:absolute before:left-[-12px] before:top-[10px] before:w-1.5 before:h-1.5 before:bg-sky-500 before:rounded-full">
              <strong className="text-slate-100 font-semibold">{boldPart}</strong>: {restPart}
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
            <li key={idx} className="ml-4 mb-2 text-slate-300 leading-relaxed relative pl-2 before:content-[''] before:absolute before:left-[-12px] before:top-[10px] before:w-1.5 before:h-1.5 before:bg-slate-500 before:rounded-full">
              <a href={linkUrl} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:text-sky-300 underline underline-offset-4 decoration-sky-400/30 transition-colors">
                {linkText}
              </a>
              {restText}
            </li>
          );
        }
        return (
          <li key={idx} className="ml-4 mb-2 text-slate-300 leading-relaxed relative pl-2 before:content-[''] before:absolute before:left-[-12px] before:top-[10px] before:w-1.5 before:h-1.5 before:bg-slate-500 before:rounded-full">
            {content}
          </li>
        );
      }

      // Bold text line
      if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
        return (
          <p key={idx} className="font-bold text-slate-100 my-3 text-lg">
            {trimmed.replace(/\*\*/g, "")}
          </p>
        );
      }
      if (trimmed.includes("**")) {
        // Simple inline bolding
        const parts = trimmed.split("**");
        return (
          <p key={idx} className="text-slate-300 leading-relaxed my-3">
            {parts.map((part, pidx) => pidx % 2 === 1 ? <strong key={pidx} className="text-slate-100 font-semibold">{part}</strong> : part)}
          </p>
        );
      }

      // Empty line
      if (trimmed === "") {
        return <div key={idx} className="h-2" />;
      }

      // Standard paragraph
      return (
        <p key={idx} className="text-slate-300 leading-relaxed my-3">
          {trimmed}
        </p>
      );
    });
  };

  return (
    <div ref={containerRef} className="p-6 md:p-10 max-w-[95%] xl:max-w-[1400px] mx-auto flex flex-col gap-6 w-full">
      <div className="narrative-fade flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h2 className="section-header mb-2 flex items-center gap-2">
            <FileText className="w-5 h-5" /> Executive Intelligence
          </h2>
          <h1 className="text-4xl font-bold text-slate-100 tracking-tight">Strategic Risk Narrative</h1>
        </div>
        <ShimmerButton
          onClick={fetchNarrative}
          loading={loading}
          variant="secondary"
          className="shrink-0"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          {loading ? "Generating Briefing..." : "Regenerate Briefing"}
        </ShimmerButton>
      </div>

      {loading ? (
        <GlassCard className="narrative-fade p-8 flex flex-col gap-6" animate={false}>
          <div className="flex items-center gap-3 mb-4 text-sky-400 font-medium animate-pulse">
            <RefreshCw className="w-5 h-5 animate-spin" />
            Synthesizing GDELT news flows, price signals, and vessel densities into a strategic narrative...
          </div>
          <Skeleton height={32} width="40%" />
          <Skeleton height={80} />
          <Skeleton height={24} width="20%" className="mt-4" />
          <Skeleton height={16} width="80%" />
          <Skeleton height={16} width="75%" />
          <Skeleton height={16} width="85%" />
        </GlassCard>
      ) : error ? (
        <GlassCard glowColor="red" className="narrative-fade p-8 bg-red-950/20 border-red-900/30">
          <h3 className="text-xl font-bold text-red-400 flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5" /> Narrative Service Offline
          </h3>
          <p className="text-red-200/70">{error}</p>
        </GlassCard>
      ) : (
        <GlassCard 
          className="narrative-fade p-8 md:p-10" 
          glowColor="blue"
          animate={false}
        >
          <div className="prose prose-invert max-w-none">
            {renderMarkdown(narrativeText)}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
