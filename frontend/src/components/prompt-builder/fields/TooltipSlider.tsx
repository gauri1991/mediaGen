'use client';

import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

interface TooltipSliderProps {
  label: string;
  tooltip: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  format?: (v: number) => string;
  onChange: (value: number) => void;
}

export function TooltipSlider({ label, tooltip, value, min, max, step = 1, format, onChange }: TooltipSliderProps) {
  const display = format ? format(value) : String(value);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium">{label}</span>
          <TooltipProvider delay={0}>
            <Tooltip>
              <TooltipTrigger
                render={<button type="button" className="text-muted-foreground/40 hover:text-muted-foreground transition-colors" />}
              >
                <Info className="w-3 h-3" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[200px] text-xs">{tooltip}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">{display}</span>
      </div>
      <Slider
        min={min} max={max} step={step}
        value={[value]}
        onValueChange={(vals) => {
          const v = Array.isArray(vals) ? vals[0] : vals;
          if (typeof v === 'number') onChange(v);
        }}
        className="w-full"
      />
    </div>
  );
}
