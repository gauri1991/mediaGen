'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dice6 } from 'lucide-react';

interface SeedFieldProps {
  value: number | null;
  onChange: (value: number | null) => void;
}

export function SeedField({ value, onChange }: SeedFieldProps) {
  function randomize() {
    onChange(Math.floor(Math.random() * 2147483647));
  }

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    if (raw === '') { onChange(null); return; }
    const n = parseInt(raw, 10);
    if (!isNaN(n)) onChange(n);
  }

  return (
    <div className="flex gap-1.5">
      <Input
        type="number"
        min={0}
        max={2147483647}
        placeholder="Random"
        value={value ?? ''}
        onChange={handleInput}
        className="h-8 text-sm"
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={randomize}
        title="Randomize seed"
      >
        <Dice6 className="w-3.5 h-3.5" />
      </Button>
      {value !== null && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-muted-foreground/60 hover:text-foreground"
          onClick={() => onChange(null)}
          title="Clear seed"
        >
          ×
        </Button>
      )}
    </div>
  );
}
