import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface AnimatedBeamProps {
  fromRef: React.RefObject<HTMLElement | null>;
  toRef: React.RefObject<HTMLElement | null>;
  containerRef: React.RefObject<HTMLElement | null>;
  className?: string;
  color?: string;
}

export const AnimatedBeam = ({
  fromRef,
  toRef,
  containerRef,
  className,
  color = "#38bdf8",
}: AnimatedBeamProps) => {
  const [path, setPath] = useState("");
  const [svgDimensions, setSvgDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updatePath = () => {
      if (!fromRef.current || !toRef.current || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const fromRect = fromRef.current.getBoundingClientRect();
      const toRect = toRef.current.getBoundingClientRect();

      setSvgDimensions({
        width: containerRect.width,
        height: containerRect.height,
      });

      const startX = fromRect.left - containerRect.left + fromRect.width / 2;
      const startY = fromRect.top - containerRect.top + fromRect.height / 2;
      const endX = toRect.left - containerRect.left + toRect.width / 2;
      const endY = toRect.top - containerRect.top + toRect.height / 2;

      // Create a smooth curve
      const controlY = startY + (endY - startY) / 2;
      const newPath = `M ${startX} ${startY} C ${startX} ${controlY}, ${endX} ${controlY}, ${endX} ${endY}`;
      
      setPath(newPath);
    };

    updatePath();
    window.addEventListener("resize", updatePath);
    // Observe DOM changes that might affect positions
    const observer = new ResizeObserver(updatePath);
    if (containerRef.current) observer.observe(containerRef.current);
    if (fromRef.current) observer.observe(fromRef.current);
    if (toRef.current) observer.observe(toRef.current);

    return () => {
      window.removeEventListener("resize", updatePath);
      observer.disconnect();
    };
  }, [fromRef, toRef, containerRef]);

  if (!path) return null;

  return (
    <svg
      className={cn("absolute top-0 left-0 pointer-events-none overflow-visible", className)}
      width={svgDimensions.width}
      height={svgDimensions.height}
    >
      {/* Base line */}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeOpacity="0.2"
        className="transition-all duration-300"
      />
      {/* Animated beam */}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        className="animate-[beam-flow_2s_linear_infinite]"
        style={{
          strokeDasharray: "20, 200",
          filter: `drop-shadow(0 0 4px ${color})`,
        }}
      />
    </svg>
  );
};
