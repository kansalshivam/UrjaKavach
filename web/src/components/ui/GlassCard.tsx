import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

interface GlassCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onDragLeave' | 'onDragOver' | 'onAnimationStart'> {
  children: React.ReactNode;
  className?: string;
  glowColor?: 'blue' | 'red' | 'amber' | 'green' | 'purple';
  hover?: boolean;
  animate?: boolean;
}

const GLOW_CLASSES: Record<string, string> = {
  blue: 'glow-border-blue',
  red: 'glow-border-red',
  amber: 'glow-border-amber',
  green: 'glow-border-green',
  purple: 'glow-border-purple',
};

const HOVER_GLOW_CLASSES: Record<string, string> = {
  blue: 'hover-glow-blue',
  red: 'hover-glow-red',
  amber: 'hover-glow-amber',
  green: 'hover-glow-green',
  purple: 'hover-glow-purple',
};

export function GlassCard({ children, className, glowColor, hover = true, animate = true, ...props }: GlassCardProps) {
  const CardWrapper = animate ? motion.div : 'div';
  const animationProps = animate ? {
    initial: { opacity: 0, y: 20, scale: 0.98 },
    whileInView: { opacity: 1, y: 0, scale: 1 },
    viewport: { once: true, margin: "-50px" },
    transition: { duration: 0.5, ease: "easeOut" }
  } : {};

  return (
    <CardWrapper
      {...animationProps}
      className={cn(
        'glass-card',
        hover && 'glass-card-hover',
        glowColor && GLOW_CLASSES[glowColor],
        hover && glowColor && HOVER_GLOW_CLASSES[glowColor],
        className
      )}
      {...props}
    >
      {children}
    </CardWrapper>
  );
}
