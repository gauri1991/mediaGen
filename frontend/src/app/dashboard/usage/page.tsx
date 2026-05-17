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
  by_modality: { modality: string; count: number; cost: number }[];
}

const MODALITY_ICON: Record<string, React.ElementType> = {
  image: Image, video: Video, audio: Music,
};

const STATUS_ICON: Record<string, { icon: React.ElementType; classes: string }> = {
  queued: { icon: Clock, classes: 'text-yellow-500' },
  processing: { icon: Loader2, classes: 'text-cyan-500' },
  completed: { icon: CheckCircle2, classes: 'text-green-500' },
  failed: { icon: XCircle, classes: 'text-red-500' },
};

function StatCard({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
      {sub && <p className="text-xs text-muted-foreground/60 mt-1">{sub}</p>}
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

  const completed = data?.completed ?? 0;
  const failed = data?.failed ?? 0;
  const successRate = data?.total ? Math.round((completed / data.total) * 100) : 0;

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Usage</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Generation stats and cost breakdown</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Total Jobs" value={data?.total ?? 0} />
            <StatCard label="Total Cost" value={`$${(data?.total_cost ?? 0).toFixed(4)}`} />
            <StatCard label="Completed" value={completed} sub={`${successRate}% success rate`} />
            <StatCard label="Failed" value={failed} />
          </div>

          {/* By modality */}
          {data && data.by_modality.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold">By type</h2>
              <div className="rounded-xl border border-border bg-card divide-y divide-border px-4">
                {data.by_modality.map(({ modality, count, cost }) => {
                  const Icon = MODALITY_ICON[modality] ?? Image;
                  return (
                    <div key={modality} className="flex items-center gap-3 py-3">
                      <Icon className="w-4 h-4 text-muted-foreground" />
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

          {/* Status summary */}
          {data && (data.completed > 0 || data.failed > 0) && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold">By status</h2>
              <div className="rounded-xl border border-border bg-card divide-y divide-border px-4">
                {([['completed', completed], ['failed', failed]] as [string, number][]).map(([status, count]) => {
                  const cfg = STATUS_ICON[status];
                  const Icon = cfg?.icon ?? Clock;
                  return (
                    <div key={status} className="flex items-center gap-3 py-3">
                      <Icon className={`w-4 h-4 ${cfg?.classes ?? 'text-muted-foreground'}`} />
                      <span className="text-sm capitalize flex-1">{status}</span>
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {data?.total === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No generations yet. <Link href="/dashboard/generate" className="text-cyan-600 hover:underline">Start creating →</Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
