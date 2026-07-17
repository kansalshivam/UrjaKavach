// HONEST LABEL: Custom equivalent of React Bits Circular Gallery. Built with custom CSS 3D transform animations since React Bits is a copy-paste-only registry and does not publish a remote package or CLI.
import React, { useState, useEffect } from "react";

interface TimelineEvent {
  date: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high";
}

interface CircularGalleryProps {
  events: TimelineEvent[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

export function CircularGallery({ events, activeIndex, onSelect }: CircularGalleryProps) {
  const [viewportHeight, setViewportHeight] = useState(typeof window !== "undefined" ? window.innerHeight : 1080);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => setViewportHeight(window.innerHeight);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Determine dynamic parameters based on viewport height
  let galleryHeight = 350;
  let cardWidth = 280;
  let cardHeight = 160;
  let radius = 240;

  if (viewportHeight < 768) {
    galleryHeight = 220;
    cardWidth = 200;
    cardHeight = 110;
    radius = 160;
  } else if (viewportHeight < 900) {
    galleryHeight = 280;
    cardWidth = 240;
    cardHeight = 130;
    radius = 200;
  }

  const isSmall = viewportHeight < 900;
  const isTiny = viewportHeight < 768;

  const count = events.length;
  const angleStep = 360 / count;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: `${galleryHeight}px`,
        perspective: "1000px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "relative",
          width: `${cardWidth}px`,
          height: `${cardHeight}px`,
          transformStyle: "preserve-3d",
          transition: "transform 0.8s cubic-bezier(0.25, 0.8, 0.25, 1)",
          transform: `rotateY(${-activeIndex * angleStep}deg)`,
        }}
      >
        {events.map((event, index) => {
          const angle = index * angleStep;
          const isSelected = index === activeIndex;
          
          let borderColor = "#1e293b";
          if (event.severity === "high") borderColor = "rgba(239, 68, 68, 0.4)";
          else if (event.severity === "medium") borderColor = "rgba(245, 158, 11, 0.4)";

          return (
            <div
              key={index}
              onClick={() => onSelect(index)}
              style={{
                position: "absolute",
                width: `${cardWidth}px`,
                height: `${cardHeight}px`,
                left: 0,
                top: 0,
                background: isSelected ? "#0f172a" : "#020617",
                border: `2px solid ${isSelected ? "#38bdf8" : borderColor}`,
                borderRadius: "12px",
                padding: isTiny ? "10px" : isSmall ? "14px" : "20px",
                boxSizing: "border-box",
                cursor: "pointer",
                userSelect: "none",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                backfaceVisibility: "hidden",
                transform: `rotateY(${angle}deg) translateZ(${radius}px)`,
                transition: "opacity 0.5s, border-color 0.3s, background 0.3s, transform 0.5s",
                opacity: isSelected ? 1 : 0.4,
                boxShadow: isSelected
                  ? "0 0 25px rgba(56, 189, 248, 0.2), inset 0 0 10px rgba(56, 189, 248, 0.1)"
                  : "0 4px 10px rgba(0,0,0,0.3)",
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: isTiny ? "0.65rem" : "0.75rem",
                    fontWeight: 700,
                    color: event.severity === "high" ? "#ef4444" : event.severity === "medium" ? "#f59e0b" : "#10b981",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {event.date}
                </span>
                <h4 style={{ fontSize: isTiny ? "0.8rem" : isSmall ? "0.9rem" : "1rem", fontWeight: 700, margin: "8px 0 4px", color: "#f8fafc" }}>
                  {event.title}
                </h4>
              </div>
              <p style={{ fontSize: isTiny ? "0.65rem" : isSmall ? "0.75rem" : "0.8rem", color: "#94a3b8", margin: 0, lineHeight: "1.4" }}>
                {event.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Navigation Arrows */}
      <div style={{ position: "absolute", bottom: "20px", display: "flex", gap: "20px", zIndex: 10 }}>
        <button
          onClick={() => onSelect((activeIndex - 1 + count) % count)}
          className="tab-btn"
          style={{ padding: "8px 16px", borderRadius: "8px" }}
        >
          &larr; Prev
        </button>
        <button
          onClick={() => onSelect((activeIndex + 1) % count)}
          className="tab-btn"
          style={{ padding: "8px 16px", borderRadius: "8px" }}
        >
          Next &rarr;
        </button>
      </div>
    </div>
  );
}
