'use client';

interface ChipGroupProps {
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
  cols?: number;
}

export function ChipGroup({ options, value, onChange, cols = 3 }: ChipGroupProps) {
  return (
    <div className={`grid gap-1.5`} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={[
            'border rounded-lg py-1.5 px-2 text-xs font-medium transition-all text-center',
            value === opt.value
              ? 'border-cyan-500 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
              : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground',
          ].join(' ')}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
