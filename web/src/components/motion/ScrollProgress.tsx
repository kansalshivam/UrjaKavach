// HONEST LABEL: Custom equivalent of Motion Primitives Scroll Progress. Developed utilizing native react scroll event listeners and state tracking since Motion Primitives is a copy-paste component without a CLI-installable registry entry.
import React, { useEffect, useState } from "react";

interface ScrollProgressProps {
  targetRef?: React.RefObject<HTMLElement>;
}

export function ScrollProgress({ targetRef }: ScrollProgressProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      let currentScroll = 0;
      let totalScroll = 1;

      if (targetRef && targetRef.current) {
        currentScroll = targetRef.current.scrollTop;
        totalScroll = targetRef.current.scrollHeight - targetRef.current.clientHeight;
      } else {
        currentScroll = window.scrollY;
        totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      }

      const percentage = totalScroll > 0 ? (currentScroll / totalScroll) * 100 : 0;
      setProgress(percentage);
    };

    const element = targetRef && targetRef.current ? targetRef.current : window;
    element.addEventListener("scroll", handleScroll);
    // Initial run
    handleScroll();

    return () => element.removeEventListener("scroll", handleScroll);
  }, [targetRef]);

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: `${progress}%`,
        height: "4px",
        background: "linear-gradient(90deg, #38bdf8 0%, #a855f7 100%)",
        boxShadow: "0 0 8px rgba(56, 189, 248, 0.6)",
        zIndex: 50,
        transition: "width 0.1s ease-out",
      }}
    />
  );
}
