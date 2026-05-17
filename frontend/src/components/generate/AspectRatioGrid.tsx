'use client';

import { Label } from '@/components/ui/label';

export type AspectRatioOption = {
  label: string;
  value: string;
  width: number;
  height: number;
};

export const IMAGE_ASPECT_RATIOS: AspectRatioOption[] = [
  { label: '1:1', value: '1:1', width: 1024, height: 1024 },
  { label: '16:9', value: '16:9', width: 1344, height: 768 },
  { label: '9:16', value: '9:16', width: 768, height: 1344 },
  { label: '4:3', value: '4:3', width: 1152, height: 896 },
  { label: '3:4', value: '3:4', width: 896, height: 1152 },
  { label: '3:2', value: '3:2', width: 1216, height: 832 },
];

export const VIDEO_ASPECT_RATIOS: AspectRatioOption[] = [
  { label: '16:9', value: '16:9', width: 768, height: 512 },
  { label: '9:16', value: '9:16', width: 512, height: 768 },
  { label: '1:1', value: '1:1', width: 512, height: 512 },
];

interface AspectRatioGridProps {
  options: AspectRatioOption[];
  value: string;
  onChange: (option: AspectRatioOption) => void;
}

export function AspectRatioGrid({ options, value, onChange }: AspectRatioGridProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">Aspect Ratio</Label>
      <div className="grid grid-cols-3 gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt)}
            className={[
              'border rounded-lg py-2 text-xs font-medium transition-all',
              value === opt.value
                ? 'border-cyan-500 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
                : 'border-border bg-card text-muted-foreground hover:border-border/60',
            ].join(' ')}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
