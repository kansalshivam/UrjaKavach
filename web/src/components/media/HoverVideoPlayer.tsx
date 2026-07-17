// HONEST LABEL: Custom equivalent of Cult UI Hover Video Player. Developed as a native CSS/JS react hover preview card since shadcn CLI add for Cult UI requires components.json initialization which is not active in this workspace.
import React, { useState, useRef, useEffect } from "react";

interface HoverVideoPlayerProps {
  thumbnailUrl: string;
  videoUrl?: string;
  overlayText: string;
  metadata?: React.ReactNode;
}

export function HoverVideoPlayer({ thumbnailUrl, videoUrl, overlayText, metadata }: HoverVideoPlayerProps) {
  const [hovered, setHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoUrl || !videoRef.current) return;
    if (hovered) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [hovered, videoUrl]);

  return (
    <div
      data-testid="hover-video-player"
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
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundImage: `url(${thumbnailUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: hovered ? "brightness(0.15) blur(1px)" : "brightness(0.7)",
          transition: "all 0.3s ease",
          zIndex: 1,
        }}
      />

      {/* Video Player */}
      {videoUrl && (
        <video
          ref={videoRef}
          src={videoUrl}
          loop
          muted
          playsInline
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: hovered ? 0.3 : 0,
            transition: "opacity 0.3s ease",
            zIndex: 2,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Center Hover text */}
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
          pointerEvents: "none",
          zIndex: 3,
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
        {videoUrl && (
          <span
            style={{
              fontSize: "0.65rem",
              color: "#94a3b8",
              background: "rgba(15, 23, 42, 0.8)",
              padding: "2px 6px",
              borderRadius: "4px",
              border: "1px solid rgba(255, 255, 255, 0.05)",
              transform: hovered ? "translateY(0)" : "translateY(10px)",
              transition: "transform 0.3s ease 0.05s",
            }}
          >
            Illustrative Stock Preview
          </span>
        )}
      </div>

      {/* Metadata Overlay (Always visible, slightly fades on hover to let center text show) */}
      {metadata && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            opacity: hovered ? 0.15 : 1,
            transition: "opacity 0.3s ease",
            pointerEvents: "none",
            zIndex: 4,
          }}
        >
          {metadata}
        </div>
      )}

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
          zIndex: 5,
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
