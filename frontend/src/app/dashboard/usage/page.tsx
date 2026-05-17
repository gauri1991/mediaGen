'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Image, Video, Music, CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';

interface UsageData {
  total: number;
  total_cost: number;
  completed: number;
  failed: number;
  queued: number;
  processing: number;
  by_modality: { modality: string; count: number; cost: number }[];
  by_model: { model_slug: string; modality: string; count: number; cost: number }[];
}

const MODALITY_ICON: Record<string, React.ElementType> = {
  image: Image, video: Video, audio: Music,
};

const STATUS_ROWS: { key: keyof UsageData; label: string; icon: React.ElementType; classes: string }[] = [
  { key: 'completed',  label: 'Completed',  icon: CheckCircle2, classes: 'text-green-500' },
  { key: 'failed',     label: 'Failed',     icon: XCircle,      classes: 'text-red-500'   },
  { key: 'processing', label: 'Processing', icon: Loader2,      classes: 'text-cyan-500'  },
  { key: 'queued',     label: 'Queued',     icon: Clock,        classes: 'text-yellow-500' },
];

function StatCard({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
      {sub && <p className="text-xs text-muted-foreground/60 mt-1">{sub}</p>}
    </div>
  );
}

function MiniBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
      <div className="h-full rounded-full bg-cyan-500" style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function UsagePage() {
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    import('@/lib/api').then(({ djangoApi }) => djangoApi.usageSummary())
      .then((d) => { if (!cancelled) { setData(d as UsageData); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const successRate = data?.total ? Math.round(((data.completed) / data.total) * 100) : 0;
  const maxModelCount = data?.by_model[0]?.count ?? 1;

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Usage</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Generation stats and cost breakdown</p>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
          <Skeleton className="h-40 rounded-xl" />
        </div>
      ) : data?.total === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No generations yet.{' '}
          <Link href="/dashboard/generate" className="text-cyan-600 hover:underline">
            Start creating →
          </Link>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Total Jobs" value={data?.total ?? 0} />
            <StatCard label="Total Cost" value={`$${(data?.total_cost ?? 0).toFixed(4)}`} />
            <StatCard
              label="Completed"
              value={data?.completed ?? 0}
              sub={`${successRate}% success rate`}
            />
            <StatCard label="Failed" value={data?.failed ?? 0} />
          </div>

          {/* By modality */}
          {data && data.by_modality.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold">By type</h2>
              <div className="rounded-xl border border-border bg-card divide-y divide-border px-4">
                {data.by_modality.map(({ modality, count, cost }) => {
                  const Icon = MODALITY_ICON[modality] ?? Image;
                  return (
                    <div key={modality} className="flex items-center gap-3 py-3">
                      <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-sm capitalize flex-1">{modality}</span>
                      <span className="text-sm font-medium">{count} jobs</span>
                      <span className="text-sm text-muted-foreground/60 w-20 text-right">
                        ${cost.toFixed(4)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* By model */}
          {data && data.by_model.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold">By model</h2>
              <div className="rounded-xl border border-border bg-card divide-y divide-border px-4">
                {data.by_model.map(({ model_slug, modality, count, cost }) => {
                  const Icon = MODALITY_ICON[modality] ?? Image;
                  return (
                    <div key={model_slug} className="flex items-center gap-3 py-3">
                      <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-mono truncate">{model_slug}</p>
                        <p className="text-xs text-muted-foreground/50 capitalize">{modality}</p>
                      </div>
                      <MiniBar value={count} max={maxModelCount} />
                      <span className="text-sm font-medium w-12 text-right">{count}</span>
                      <span className="text-sm text-muted-foreground/60 w-20 text-right">
                        ${cost.toFixed(4)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* By status */}
          {data && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold">By status</h2>
              <div className="rounded-xl border border-border bg-card divide-y divide-border px-4">
                {STATUS_ROWS.filter(({ key }) => (data[key] as number) > 0).map(({ key, label, icon: Icon, classes }) => (
                  <div key={key} className="flex items-center gap-3 py-3">
                    <Icon className={`w-4 h-4 shrink-0 ${classes}`} />
                    <span className="text-sm flex-1">{label}</span>
                    <span className="text-sm font-medium">{data[key] as number}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
