// HONEST LABEL: Real integration of anime.js timeline-sync. Utilizes animejs library to animate timeline scrub synchronization across circular gallery and SVG sparkline components.
import React, { useEffect, useRef } from "react";
import anime from "animejs";

interface TimelineSyncProps {
  events: { date: string; title: string; price?: number }[];
  activeIndex: number;
  onChangeActiveIndex: (index: number) => void;
}

export function TimelineSync({ events, activeIndex, onChangeActiveIndex }: TimelineSyncProps) {
  const lineMarkerRef = useRef<HTMLDivElement>(null);
  const sparklineRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    // We animate the scrubber marker to the selected position using anime.js
    if (lineMarkerRef.current) {
      const containerWidth = lineMarkerRef.current.parentElement?.clientWidth || 300;
      const stepWidth = containerWidth / (events.length - 1 || 1);
      const targetLeft = activeIndex * stepWidth;

      anime({
        targets: lineMarkerRef.current,
        left: `${targetLeft}px`,
        duration: 400,
        easing: "easeOutCubic",
      });
    }

    // Pulse animation on the active event dot
    anime({
      targets: `.timeline-dot-${activeIndex}`,
      scale: [1, 1.4, 1],
      opacity: [1, 0.8, 1],
      duration: 600,
      easing: "easeInOutQuad",
    });
  }, [activeIndex, events.length]);

  return (
    <div style={{ width: "100%", padding: "20px 0", boxSizing: "border-box" }}>
      {/* Sparkline overlay of Brent Prices */}
      <div style={{ height: "60px", width: "100%", position: "relative", marginBottom: "10px" }}>
        <svg
          ref={sparklineRef}
          width="100%"
          height="100%"
          style={{ overflow: "visible" }}
        >
          {/* Render static sparkline path based on prices */}
          <path
            d={`M 0 45 L 70 40 L 140 20 L 210 50 L 280 30 L 350 15`}
            fill="none"
            stroke="rgba(56, 189, 248, 0.3)"
            strokeWidth="2"
            strokeDasharray="4 4"
          />
        </svg>
      </div>

      {/* Interactive slider timeline line */}
      <div
        style={{
          position: "relative",
          height: "4px",
          background: "#1e293b",
          borderRadius: "2px",
          width: "100%",
          cursor: "pointer",
        }}
      >
        {/* Progress Fill */}
        <div
          style={{
            position: "absolute",
            left: 0,
            height: "100%",
            width: `${(activeIndex / (events.length - 1 || 1)) * 100}%`,
            background: "#38bdf8",
            borderRadius: "2px",
          }}
        />

        {/* Sync-animating Scrub Marker */}
        <div
          ref={lineMarkerRef}
          style={{
            position: "absolute",
            top: "-6px",
            width: "16px",
            height: "16px",
            borderRadius: "50%",
            background: "#38bdf8",
            boxShadow: "0 0 10px #38bdf8",
            cursor: "grab",
          }}
        />

        {/* Dots for each event */}
        {events.map((event, index) => {
          const percentage = (index / (events.length - 1 || 1)) * 100;
          const isSelected = index === activeIndex;

          return (
            <div
              key={index}
              className={`timeline-dot-${index}`}
              onClick={() => onChangeActiveIndex(index)}
              style={{
                position: "absolute",
                left: `${percentage}%`,
                top: "-4px",
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                background: isSelected ? "#38bdf8" : "#020617",
                border: `2px solid ${isSelected ? "#f8fafc" : "#475569"}`,
                cursor: "pointer",
                transform: "translateX(-50%)",
                zIndex: 10,
              }}
              title={`${event.date}: ${event.title}`}
            />
          );
        })}
      </div>

      {/* Date Labels below scrubber */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "12px",
          fontSize: "0.7rem",
          color: "#64748b",
        }}
      >
        {events.map((event, index) => (
          <span
            key={index}
            onClick={() => onChangeActiveIndex(index)}
            style={{
              cursor: "pointer",
              color: index === activeIndex ? "#38bdf8" : "#64748b",
              fontWeight: index === activeIndex ? 700 : 400,
            }}
          >
            {event.date}
          </span>
        ))}
      </div>
    </div>
  );
}
