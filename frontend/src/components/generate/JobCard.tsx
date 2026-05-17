'use client';

import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle, Clock, X } from 'lucide-react';

type JobStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';

interface JobCardProps {
  status: JobStatus;
  progress?: number | null;
  errorMessage?: string | null;
  onCancel?: () => void;
}

const STATUS_CONFIG: Record<JobStatus, {
  label: string;
  icon: React.ElementType;
  iconClass: string;
  borderClass: string;
  bgClass: string;
}> = {
  queued: {
    label: 'Queued',
    icon: Clock,
    iconClass: 'text-yellow-500',
    borderClass: 'border-yellow-200',
    bgClass: 'from-yellow-50/60 via-card to-card',
  },
  processing: {
    label: 'Generating…',
    icon: Loader2,
    iconClass: 'text-cyan-500 animate-spin',
    borderClass: 'border-cyan-200',
    bgClass: 'from-cyan-50/60 via-blue-50/40 to-card',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    iconClass: 'text-green-500',
    borderClass: 'border-green-200',
    bgClass: 'from-green-50/60 via-card to-card',
  },
  failed: {
    label: 'Failed',
    icon: XCircle,
    iconClass: 'text-red-500',
    borderClass: 'border-red-200',
    bgClass: 'from-red-50/60 via-card to-card',
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    iconClass: 'text-muted-foreground',
    borderClass: 'border-border',
    bgClass: 'from-muted/60 via-card to-card',
  },
};

export function JobCard({ status, progress, errorMessage, onCancel }: JobCardProps) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.failed;
  const Icon = cfg.icon;
  const progressVal = progress ?? (status === 'processing' ? undefined : status === 'completed' ? 100 : 0);

  return (
    <div className={`border-2 ${cfg.borderClass} bg-gradient-to-br ${cfg.bgClass} rounded-xl p-4 shadow-sm`}>
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 shrink-0 ${cfg.iconClass}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{cfg.label}</p>
          {errorMessage && (
            <p className="text-xs text-red-500 mt-0.5 truncate">{errorMessage}</p>
          )}
        </div>
        {progressVal !== undefined && status === 'processing' && (
          <span className="text-xs tabular-nums text-muted-foreground/60">{progressVal}%</span>
        )}
        {onCancel && (status === 'queued' || status === 'processing') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            aria-label="Cancel generation"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {(status === 'queued' || status === 'processing') && (
        <div className="mt-3">
          <Progress
            value={status === 'queued' ? null : (progressVal ?? 0)}
            className="h-1.5"
          />
        </div>
      )}
    </div>
  );
}
