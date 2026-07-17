import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

interface ShimmerButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onAnimationStart' | 'onDrag' | 'onDragStart' | 'onDragEnd'> {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function ShimmerButton({
  children,
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  ...props
}: ShimmerButtonProps) {
  const baseClasses = "relative overflow-hidden rounded-lg font-medium transition-all duration-300 active:scale-95 flex items-center justify-center gap-2";
  
  const variants = {
    primary: "bg-gradient-to-r from-sky-500 to-purple-600 text-white shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 border border-white/10 hover:brightness-110",
    secondary: "bg-slate-800/50 backdrop-blur-sm text-slate-200 border border-slate-700 hover:bg-slate-700/50 hover:border-slate-500"
  };
  
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };

  return (
    <motion.button
      className={cn(baseClasses, variants[variant], sizes[size], className)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      disabled={loading || props.disabled}
      {...props}
    >
      {/* Shimmer effect overlay */}
      {!loading && !props.disabled && (
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />
      )}
      
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      <span className={cn("relative z-10", loading && "opacity-80")}>{children}</span>
    </motion.button>
  );
}
