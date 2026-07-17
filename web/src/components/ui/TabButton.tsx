import React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface TabButtonProps {
  label: string;
  icon?: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  layoutId?: string;
}

export function TabButton({ label, icon, isActive, onClick, layoutId = "active-tab-indicator" }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={cn(
        "relative flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors duration-200 rounded-md outline-none",
        isActive ? "text-sky-400" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
      )}
    >
      {icon && <span className="relative z-10">{icon}</span>}
      <span className="relative z-10 hidden xl:inline">{label}</span>
      
      {isActive && (
        <>
          <motion.div
            layoutId={`${layoutId}-bg`}
            className="absolute inset-0 rounded-md bg-sky-900/20"
            initial={false}
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
          <motion.div
            layoutId={layoutId}
            className="absolute bottom-0 left-2 right-2 h-[2px] bg-sky-400 rounded-t-full shadow-[0_0_8px_rgba(56,189,248,0.8)]"
            initial={false}
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        </>
      )}
    </button>
  );
}
