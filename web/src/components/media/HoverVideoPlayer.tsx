import React, { useState } from "react";

interface HoverVideoPlayerProps {
  thumbnailUrl: string;
  videoUrl?: string;
  overlayText: string;
  metadata?: React.ReactNode;
}

export function HoverVideoPlayer({ thumbnailUrl, videoUrl, overlayText, metadata }: HoverVideoPlayerProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        borderRadius: "8px",
        overflow: "hidden",
        cursor: "pointer",
        border: "1px solid #1e293b",
        boxShadow: hovered ? "0 0 15px rgba(56, 189, 248, 0.2)" : "none",
        transition: "all 0.3s ease",
      }}
    >
      {/* Background Thumbnail Image */}
      <div
        style={{
          width: "100%",
          height: "100%",
          backgroundImage: `url(${thumbnailUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: hovered ? "brightness(0.3) blur(2px)" : "brightness(0.8)",
          transition: "filter 0.3s ease",
        }}
      />

      {/* Hover Overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.3s ease",
          padding: "16px",
          boxSizing: "border-box",
          textAlign: "center",
        }}
      >
        <span
          style={{
            color: "#38bdf8",
            fontSize: "0.9rem",
            fontWeight: 600,
            marginBottom: "8px",
            transform: hovered ? "translateY(0)" : "translateY(10px)",
            transition: "transform 0.3s ease",
          }}
        >
          {overlayText}
        </span>
        {metadata && (
          <div
            style={{
              color: "#94a3b8",
              fontSize: "0.75rem",
              transform: hovered ? "translateY(0)" : "translateY(10px)",
              transition: "transform 0.3s ease 0.1s",
            }}
          >
            {metadata}
          </div>
        )}
      </div>

      {/* Play/Preview icon */}
      <div
        style={{
          position: "absolute",
          bottom: "12px",
          right: "12px",
          background: "rgba(15, 23, 42, 0.6)",
          borderRadius: "50%",
          width: "32px",
          height: "32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid rgba(255,255,255,0.1)",
          color: "#38bdf8",
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" />
        </svg>
      </div>
    </div>
  );
}
