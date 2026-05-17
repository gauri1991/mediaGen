'use client';

const STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  draft:    { label: 'Draft',     classes: 'bg-muted text-muted-foreground border-border' },
  active:   { label: 'Active',    classes: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30' },
  review:   { label: 'In Review', classes: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30' },
  complete: { label: 'Complete',  classes: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30' },
  archived: { label: 'Archived',  classes: 'bg-muted/50 text-muted-foreground border-border' },
};

export function ProjectStatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.classes}`}>
      {cfg.label}
    </span>
  );
}
