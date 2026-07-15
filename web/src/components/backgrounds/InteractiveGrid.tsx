// HONEST LABEL: Custom equivalent of Animata Interactive Grid. Built as a local React grid mapping hover cells since Animata does not offer an npm/CLI package.
import React, { useState, useEffect, useRef } from "react";

export function InteractiveGrid() {
  const [columns, setColumns] = useState(0);
  const [rows, setRows] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const calculateGrid = () => {
    if (containerRef.current) {
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      const cellSize = 50; // 50px cells
      setColumns(Math.ceil(width / cellSize));
      setRows(Math.ceil(height / cellSize));
    }
  };

  useEffect(() => {
    calculateGrid();
    window.addEventListener("resize", calculateGrid);
    return () => window.removeEventListener("resize", calculateGrid);
  }, []);

  const totalCells = columns * rows;

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        overflow: "hidden",
        zIndex: 0,
        pointerEvents: "auto",
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
        opacity: 0.15,
      }}
    >
      {Array.from({ length: totalCells }).map((_, index) => (
        <GridCell key={index} />
      ))}
    </div>
  );
}

function GridCell() {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        border: "1px solid rgba(56, 189, 248, 0.05)",
        aspectRatio: "1",
        transition: hovered ? "none" : "background-color 1s ease, box-shadow 1s ease",
        backgroundColor: hovered ? "rgba(56, 189, 248, 0.25)" : "transparent",
        boxShadow: hovered ? "0 0 10px rgba(56, 189, 248, 0.4)" : "none",
      }}
    />
  );
}
