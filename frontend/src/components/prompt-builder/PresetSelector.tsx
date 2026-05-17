'use client';

import { useState } from 'react';
import { BookmarkPlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BUILT_IN_PRESETS, type Preset, type AudioSubType } from '@/lib/prompt-assembler';
import { toast } from 'sonner';

interface PresetSelectorProps {
  modality: 'image' | 'video' | 'audio';
  audioSubType?: AudioSubType;
  onSelect: (preset: Preset) => void;
  onSave: (label: string) => void;
}

const STORAGE_KEY = 'mediagen_presets';

function loadCustom(): Preset[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'); } catch { return []; }
}

function saveCustom(presets: Preset[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}

export function PresetSelector({ modality, audioSubType, onSelect, onSave }: PresetSelectorProps) {
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState('');
  const [custom, setCustom] = useState<Preset[]>(() => loadCustom());

  const builtIn = BUILT_IN_PRESETS.filter((p) => {
    if (p.modality !== modality) return false;
    if (modality === 'audio' && audioSubType && p.audioSubType !== audioSubType) return false;
    return true;
  });

  const myCustom = custom.filter((p) => {
    if (p.modality !== modality) return false;
    if (modality === 'audio' && audioSubType && p.audioSubType !== audioSubType) return false;
    return true;
  });

  function handleSave() {
    if (!newName.trim()) return;
    onSave(newName.trim());
    setSaving(false);
    setNewName('');
    toast.success('Preset saved');
  }

  function deleteCustom(id: string) {
    const updated = custom.filter((p) => p.id !== id);
    setCustom(updated);
    saveCustom(updated);
  }

  if (builtIn.length === 0 && myCustom.length === 0 && !saving) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
          Presets
        </span>
        <button
          type="button"
          onClick={() => setSaving((v) => !v)}
          className="text-muted-foreground/40 hover:text-muted-foreground transition-colors"
          title="Save current as preset"
        >
          <BookmarkPlus className="w-3.5 h-3.5" />
        </button>
      </div>

      {saving && (
        <div className="flex gap-1.5">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Preset name…"
            className="h-7 text-xs"
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setSaving(false); }}
            autoFocus
          />
          <Button size="sm" className="h-7 px-2 text-xs" onClick={handleSave}>Save</Button>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {builtIn.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onSelect(preset)}
            className="text-xs border border-border bg-muted/40 rounded-full px-2.5 py-1 text-muted-foreground hover:border-cyan-500 hover:bg-cyan-500/10 hover:text-cyan-600 transition-all"
          >
            {preset.label}
          </button>
        ))}
        {myCustom.map((preset) => (
          <div key={preset.id} className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => onSelect(preset)}
              className="text-xs border border-cyan-500/40 bg-cyan-500/10 rounded-l-full pl-2.5 pr-1 py-1 text-cyan-600 dark:text-cyan-400 hover:border-cyan-500 transition-all"
            >
              {preset.label}
            </button>
            <button
              type="button"
              onClick={() => deleteCustom(preset.id)}
              className="text-xs border border-cyan-500/40 border-l-0 bg-cyan-500/10 rounded-r-full px-1 py-1 text-cyan-500/60 hover:text-red-500 hover:border-red-400/40 transition-all"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function savePresetToStorage(preset: Preset) {
  const current = loadCustom();
  const updated = [...current.filter((p) => p.id !== preset.id), preset];
  saveCustom(updated);
}
