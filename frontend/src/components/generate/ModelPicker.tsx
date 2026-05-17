'use client';

import { Label } from '@/components/ui/label';
import { modelsByModality } from '@/lib/models/registry';

type Modality = 'image' | 'video' | 'audio';

interface ModelPickerProps {
  modality: Modality;
  value: string;
  onChange: (slug: string) => void;
}

export function ModelPicker({ modality, value, onChange }: ModelPickerProps) {
  const all = modelsByModality(modality);
  const available = all.filter(({ config }) => !config.comingSoon);
  const comingSoon = all.filter(({ config }) => config.comingSoon);

  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">Model</Label>
      <div className="space-y-1 max-h-56 overflow-y-auto pr-0.5">
        {available.map(({ slug, config }) => {
          const cost = config.providers[config.defaultProvider]?.costEstimate;
          const active = value === slug;
          return (
            <button
              key={slug}
              type="button"
              onClick={() => onChange(slug)}
              className={[
                'w-full flex items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-all',
                active
                  ? 'border-cyan-500 bg-cyan-50/50 text-foreground'
                  : 'border-border bg-card text-foreground hover:border-border/60 hover:bg-muted/30',
              ].join(' ')}
            >
              <span className="font-medium">{config.label}</span>
              {cost != null && (
                <span className="text-xs text-muted-foreground/60 tabular-nums shrink-0 ml-2">
                  ~${cost.toFixed(3)}
                </span>
              )}
            </button>
          );
        })}

        {comingSoon.length > 0 && (
          <>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40 px-0.5 pt-2 pb-0.5">
              Coming soon
            </p>
            {comingSoon.map(({ slug, config }) => (
              <div
                key={slug}
                className="w-full flex items-center justify-between rounded-lg border border-border/40 bg-card/50 px-3 py-2 text-sm opacity-50 cursor-not-allowed select-none"
              >
                <span className="text-muted-foreground">{config.label}</span>
                <span className="text-[10px] bg-muted border border-border rounded-full px-1.5 py-0.5 text-muted-foreground/60 shrink-0">
                  Soon
                </span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
