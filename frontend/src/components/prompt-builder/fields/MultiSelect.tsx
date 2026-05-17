'use client';

interface MultiSelectProps {
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  max?: number;
}

export function MultiSelect({ options, value, onChange, max }: MultiSelectProps) {
  function toggle(opt: string) {
    if (value.includes(opt)) {
      onChange(value.filter((v) => v !== opt));
    } else if (!max || value.length < max) {
      onChange([...value, opt]);
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const active = value.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={[
              'border rounded-full px-2.5 py-1 text-xs font-medium transition-all',
              active
                ? 'border-cyan-500 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
                : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground',
            ].join(' ')}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}
