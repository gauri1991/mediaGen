'use client';

import { Image, Video, Music } from 'lucide-react';

type Modality = 'image' | 'video' | 'audio';

const MODES: { value: Modality; label: string; icon: React.ElementType }[] = [
  { value: 'image', label: 'Image', icon: Image },
  { value: 'video', label: 'Video', icon: Video },
  { value: 'audio', label: 'Audio', icon: Music },
];

interface ModeSwitcherProps {
  value: Modality;
  onChange: (mode: Modality) => void;
}

export function ModeSwitcher({ value, onChange }: ModeSwitcherProps) {
  return (
    <div className="inline-flex bg-card p-1 rounded-full border border-border shadow-sm">
      {MODES.map(({ value: mode, label, icon: Icon }) => (
        <button
          key={mode}
          type="button"
          onClick={() => onChange(mode)}
          className={[
            'flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all',
            value === mode
              ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          ].join(' ')}
        >
          <Icon className="w-3.5 h-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
}
