'use client';

import { ChevronDown } from 'lucide-react';

interface AdvancedSectionProps {
  children: React.ReactNode;
  label?: string;
  defaultOpen?: boolean;
}

export function AdvancedSection({ children, label = 'Advanced', defaultOpen = false }: AdvancedSectionProps) {
  return (
    <details className="group" open={defaultOpen}>
      <summary className="list-none flex items-center gap-1.5 cursor-pointer select-none py-1">
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/60 transition-transform group-open:rotate-0 -rotate-90" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
          {label}
        </span>
      </summary>
      <div className="pt-3 space-y-3">
        {children}
      </div>
    </details>
  );
}
