// REAL INTEGRATION: Motion Primitives Scroll Progress component.
// Installed via npx motion-primitives add scroll-progress.
// Adapted to use motion/react and standard inline CSS instead of external cn utilities.
import React, { RefObject } from "react";
import { motion, SpringOptions, useScroll, useSpring } from "motion/react";

export type ScrollProgressProps = {
  springOptions?: SpringOptions;
  containerRef?: RefObject<HTMLElement>;
};

const DEFAULT_SPRING_OPTIONS: SpringOptions = {
  stiffness: 200,
  damping: 50,
  restDelta: 0.001,
};

export function ScrollProgress({
  springOptions,
  containerRef,
}: ScrollProgressProps) {
  const { scrollYProgress } = useScroll({
    container: containerRef,
    layoutEffect: Boolean(containerRef?.current),
  });

  const scaleX = useSpring(scrollYProgress, {
    ...DEFAULT_SPRING_OPTIONS,
    ...(springOptions ?? {}),
  });

  return (
    <motion.div
      style={{
        scaleX,
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "4px",
        background: "linear-gradient(90deg, #38bdf8 0%, #a855f7 100%)",
        boxShadow: "0 0 8px rgba(56, 189, 248, 0.6)",
        zIndex: 50,
        originX: 0,
      }}
    />
  );
}
