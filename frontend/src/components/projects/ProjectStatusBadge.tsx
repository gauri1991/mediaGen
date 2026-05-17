'use client';

const STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  draft:    { label: 'Draft',     classes: 'bg-muted text-muted-foreground border-border' },
  active:   { label: 'Active',    classes: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  review:   { label: 'In Review', classes: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  complete: { label: 'Complete',  classes: 'bg-green-50 text-green-700 border-green-200' },
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
