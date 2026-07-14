import React, { useState, useRef, MouseEvent } from "react";

interface CursorCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export const CursorCard: React.FC<CursorCardProps> = ({
  children,
  className = "",
  glowColor = "rgba(56, 189, 248, 0.15)", // Default sky-400 glow
  onClick,
  style = {},
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCoords({ x, y });

    // Calculate 3D tilt angles based on position relative to center of the card
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const tiltX = ((y - centerY) / centerY) * -4; // Capped at -4 to 4 degrees
    const tiltY = ((x - centerX) / centerX) * 4;  // Capped at -4 to 4 degrees
    setTilt({ x: tiltX, y: tiltY });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 }); // Reset tilt
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={`cursor-card-container ${className}`}
      style={{
        position: "relative",
        background: "#161b22",
        border: "1px solid #30363d",
        borderRadius: "8px",
        padding: "16px",
        overflow: "hidden",
        cursor: onClick ? "pointer" : "default",
        transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: isHovered ? "none" : "transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)",
        boxShadow: isHovered ? "0 4px 20px rgba(0, 0, 0, 0.3)" : "0 2px 8px rgba(0, 0, 0, 0.2)",
        ...style,
      }}
    >
      {/* Radial Hover Glow overlay */}
      {isHovered && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: "none",
            background: `radial-gradient(400px circle at ${coords.x}px ${coords.y}px, ${glowColor}, transparent 80%)`,
            zIndex: 0,
          }}
        />
      )}
      {/* Content wrapper to force z-index stacking above glow */}
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );
};
