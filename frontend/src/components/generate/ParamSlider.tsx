'use client';

import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

interface ParamSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  format?: (v: number) => string;
}

export function ParamSlider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format,
}: ParamSliderProps) {
  const display = format ? format(value) : String(value);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <span className="text-xs text-muted-foreground tabular-nums">{display}</span>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
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
