'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { modelsByModality } from '@/lib/models/registry';

type Modality = 'image' | 'video' | 'audio';

interface ModelPickerProps {
  modality: Modality;
  value: string;
  onChange: (slug: string) => void;
}

export function ModelPicker({ modality, value, onChange }: ModelPickerProps) {
  const models = modelsByModality(modality);

  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">Model</Label>
      <Select value={value} onValueChange={(v) => { if (v) onChange(v); }}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select model" />
        </SelectTrigger>
        <SelectContent>
          {models.map(({ slug, config }) => (
            <SelectItem key={slug} value={slug}>
              <span>{config.label}</span>
              <span className="ml-2 text-xs text-muted-foreground/60">
                ~${config.providers[config.defaultProvider]?.costEstimate?.toFixed(3)}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
