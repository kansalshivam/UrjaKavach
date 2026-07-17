import React, { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface CustomSliderProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  ariaLabel?: string;
  unit?: string;
  colorScheme?: 'blue' | 'gradient';
  className?: string;
}

export function CustomSlider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  ariaLabel,
  unit = '',
  colorScheme = 'gradient',
  className
}: CustomSliderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const range = max - min;
  const percentage = range === 0 ? 0 : Math.max(0, Math.min(100, ((value - min) / range) * 100));

  const getColor = (pct: number) => {
    if (colorScheme === 'blue') return 'rgb(56, 189, 248)';
    if (pct < 33) return 'rgb(16, 185, 129)'; // green
    if (pct < 66) return 'rgb(245, 158, 11)'; // amber
    return 'rgb(239, 68, 68)'; // red
  };

  const currentColor = getColor(percentage);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    updateValueFromPointer(e);
  };

  const updateValueFromPointer = (e: PointerEvent | React.PointerEvent) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    if (rect.width <= 0) return;
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const pct = x / rect.width;
    const rawVal = pct * (max - min) + min;
    const steppedVal = step > 0 ? Math.round(rawVal / step) * step : rawVal;
    const finalVal = Math.max(min, Math.min(max, steppedVal));
    if (!isNaN(finalVal)) {
      onChange(finalVal);
    }
  };

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (isDragging) updateValueFromPointer(e);
    };
    const handlePointerUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging, min, max, step, onChange]);

  return (
    <div className={cn("relative w-full py-4 flex flex-col gap-2 select-none", className)}>
      {label && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-slate-300">{label}</span>
          <span className="text-sm font-bold" style={{ color: currentColor }}>
            {value.toFixed(step < 1 ? 2 : 0)}{unit}
          </span>
        </div>
      )}
      <div 
        ref={trackRef}
        className="relative h-2 rounded-full bg-slate-800 cursor-pointer"
        style={{ touchAction: 'pan-y' }}
        onPointerDown={handlePointerDown}
      >
        <div 
          className="absolute top-0 left-0 h-full rounded-full transition-colors duration-200"
          style={{ width: `${percentage}%`, backgroundColor: currentColor }}
        />
        <div 
          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-100 shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-transform duration-100 flex items-center justify-center cursor-grab active:cursor-grabbing"
          style={{ 
            left: `${percentage}%`, 
            transform: `translate(-50%, -50%) scale(${isDragging ? 1.2 : 1})`,
            boxShadow: `0 0 15px ${currentColor}`
          }}
        >
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: currentColor }} />
        </div>
        
        {/* Accessibility Input */}
        <input 
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="sr-only"
          aria-label={ariaLabel || label || "Slider"}
        />
      </div>
    </div>
  );
}
