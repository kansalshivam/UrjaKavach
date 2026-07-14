import React, { useState } from "react";

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
  const radius = 250; // px
  const count = events.length;
  const angleStep = 360 / count;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "400px",
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
          width: "280px",
          height: "180px",
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
                width: "280px",
                height: "180px",
                left: 0,
                top: 0,
                background: isSelected ? "#0f172a" : "#020617",
                border: `2px solid ${isSelected ? "#38bdf8" : borderColor}`,
                borderRadius: "12px",
                padding: "20px",
                boxSizing: "border-box",
                cursor: "pointer",
                userSelect: "none",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                backfaceVisibility: "hidden",
                transform: `rotateY(${angle}deg) translateZ(${radius}px)`,
                transition: "opacity 0.5s, border-color 0.3s, background 0.3s",
                opacity: isSelected ? 1 : 0.4,
                boxShadow: isSelected
                  ? "0 0 25px rgba(56, 189, 248, 0.2), inset 0 0 10px rgba(56, 189, 248, 0.1)"
                  : "0 4px 10px rgba(0,0,0,0.3)",
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: event.severity === "high" ? "#ef4444" : event.severity === "medium" ? "#f59e0b" : "#10b981",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {event.date}
                </span>
                <h4 style={{ fontSize: "1rem", fontWeight: 700, margin: "8px 0 4px", color: "#f8fafc" }}>
                  {event.title}
                </h4>
              </div>
              <p style={{ fontSize: "0.8rem", color: "#94a3b8", margin: 0, lineHeight: "1.4" }}>
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
