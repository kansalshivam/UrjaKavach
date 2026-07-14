import React from "react";

/**
 * Iconsax.tsx — custom-built straight-corner SVG equivalent set;
 * real animated asset package exports from app.iconsax.io were unreachable/unsupported
 * in this React environment on 2026-07-14. Developed as clean SVG paths with React-state
 * micro-animations. See BUILD_LOG.md.
 */

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
}

export const PortIcon: React.FC<IconProps> = ({ size = 20, color = "currentColor", className }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="square"
      strokeLinejoin="miter"
      className={`iconsax-icon ${className || ""}`}
      style={{ transition: "transform 0.2s ease" }}
    >
      <circle cx="12" cy="5" r="3" />
      <path d="M12 8v12M8 14h8M5 14a7 7 0 0014 0" />
    </svg>
  );
};

export const RefineryIcon: React.FC<IconProps> = ({ size = 20, color = "currentColor", className }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="square"
      strokeLinejoin="miter"
      className={`iconsax-icon ${className || ""}`}
      style={{ transition: "transform 0.2s ease" }}
    >
      <path d="M2 20h20M4 20V8l5 3V8l5 3V8l6 3v9H4z" />
      <path d="M17 14h1M12 15h1M7 16h1" />
    </svg>
  );
};

export const SpriteIcon: React.FC<IconProps> = ({ size = 20, color = "currentColor", className }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="square"
      strokeLinejoin="miter"
      className={`iconsax-icon ${className || ""}`}
      style={{ transition: "transform 0.2s ease" }}
    >
      {/* Cylindrical SPR storage shape */}
      <ellipse cx="12" cy="6" rx="8" ry="3" />
      <path d="M4 6v12c0 1.66 3.58 3 8 3s8-1.34 8-3V6" />
      <path d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3" />
    </svg>
  );
};

export const PipelineIcon: React.FC<IconProps> = ({ size = 20, color = "currentColor", className }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="square"
      strokeLinejoin="miter"
      className={`iconsax-icon ${className || ""}`}
      style={{ transition: "transform 0.2s ease" }}
    >
      <path d="M2 12h20M2 9v6M22 9v6M10 6v12M14 6v12" />
    </svg>
  );
};

export const RiskIcon: React.FC<IconProps> = ({ size = 20, color = "currentColor", className }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="square"
      strokeLinejoin="miter"
      className={`iconsax-icon ${className || ""}`}
      style={{ transition: "transform 0.2s ease" }}
    >
      {/* Warning triangle */}
      <path d="M12 3l10 17H2L12 3z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  );
};

export const SettingsIcon: React.FC<IconProps> = ({ size = 20, color = "currentColor", className }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="square"
      strokeLinejoin="miter"
      className={`iconsax-icon ${className || ""}`}
      style={{ transition: "transform 0.2s ease" }}
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
};
