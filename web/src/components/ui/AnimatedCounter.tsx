import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { motion, useInView, useSpring, useTransform } from 'motion/react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function AnimatedCounter({
  value,
  duration = 2000,
  decimals = 0,
  prefix = '',
  suffix = '',
  className,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isTest = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';

  const springValue = useSpring(isTest ? value : 0, {
    bounce: 0,
    duration: isTest ? 0 : duration,
  });

  useEffect(() => {
    springValue.set(value);
  }, [value, springValue]);

  const displayValue = useTransform(springValue, (current) => {
    return prefix + current.toFixed(decimals) + suffix;
  });

  if (isTest) {
    return (
      <span className={cn('metric-value text-slate-100 font-mono tracking-tight', className)}>
        {prefix}{value.toFixed(decimals)}{suffix}
      </span>
    );
  }

  return (
    <motion.span ref={ref} className={cn('metric-value text-slate-100 font-mono tracking-tight', className)}>
      {displayValue}
    </motion.span>
  );
}
