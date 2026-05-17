'use client';

import { Suspense, useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Sparkles, Image, Video, Music, CheckCircle2, XCircle, Clock, Loader2, ChevronUp, ChevronDown, FolderPlus } from 'lucide-react';
import { AddToProjectModal } from '@/components/projects/AddToProjectModal';

interface Asset {
  id: string;
  url: string | null;
  type: string;
}

interface Generation {
  id: string;
  modality: string;
  model_slug: string;
  provider: string;
  status: string;
  progress: number | null;
  prompt: string;
  cost_credits: number | null;
  error_message: string | null;
  created_at: string;
  assets: Asset[];
}

const STATUS_MAP: Record<string, { label: string; icon: React.ElementType; classes: string }> = {
  queued: { label: 'Queued', icon: Clock, classes: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  processing: { label: 'Processing', icon: Loader2, classes: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30' },
  completed: { label: 'Completed', icon: CheckCircle2, classes: 'bg-green-50 text-green-700 border-green-200' },
  failed: { label: 'Failed', icon: XCircle, classes: 'bg-red-50 text-red-700 border-red-200' },
};

const MODALITY_ICON: Record<string, React.ElementType> = {
  image: Image,
  video: Video,
  audio: Music,
};

type SortField = 'created_at' | 'cost_credits';
type SortDir = 'asc' | 'desc';

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_MAP[status] ?? STATUS_MAP.failed;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.classes}`}>
      <Icon className={`w-3 h-3 ${status === 'processing' ? 'animate-spin' : ''}`} />
      {cfg.label}
    </span>
  );
}

function SortIcon({ field, active, dir }: { field: SortField; active: SortField; dir: SortDir }) {
  if (field !== active) return <ChevronDown className="w-3 h-3 opacity-30 inline ml-1" />;
  return dir === 'desc'
    ? <ChevronDown className="w-3 h-3 inline ml-1" />
    : <ChevronUp className="w-3 h-3 inline ml-1" />;
}

function HistoryPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const filterStatus = searchParams.get('status') ?? 'all';
  const filterModality = searchParams.get('modality') ?? 'all';
  const sortField = (searchParams.get('sort') ?? 'created_at') as SortField;
  const sortDir = (searchParams.get('dir') ?? 'desc') as SortDir;

  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [addToProjectGenId, setAddToProjectGenId] = useState<string | null>(null);

  function updateParam(key: string, value: string) {
    const p = new URLSearchParams(searchParams.toString());
    if (value === 'all' || value === '') {
      p.delete(key);
    } else {
      p.set(key, value);
    }
    router.replace(`?${p}`);
  }

  function toggleSort(field: SortField) {
    const p = new URLSearchParams(searchParams.toString());
    if (sortField === field) {
      p.set('dir', sortDir === 'desc' ? 'asc' : 'desc');
    } else {
      p.set('sort', field);
      p.set('dir', 'desc');
    }
    router.replace(`?${p}`);
  }

  useEffect(() => {
    let cancelled = false;
    import('@/lib/api').then(({ djangoApi }) =>
      djangoApi.listGenerations({ limit: 100 })
    ).then((data) => {
      if (!cancelled) { setGenerations(data as Generation[]); setLoading(false); }
    }).catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const displayed = useMemo(() => {
    let rows = [...generations];
    if (filterStatus !== 'all') rows = rows.filter((g) => g.status === filterStatus);
    if (filterModality !== 'all') rows = rows.filter((g) => g.modality === filterModality);
    rows.sort((a, b) => {
      let va: number, vb: number;
      if (sortField === 'cost_credits') {
        va = Number(a.cost_credits ?? 0);
        vb = Number(b.cost_credits ?? 0);
      } else {
        va = new Date(a.created_at).getTime();
        vb = new Date(b.created_at).getTime();
      }
      return sortDir === 'desc' ? vb - va : va - vb;
    });
    return rows;
  }, [generations, filterStatus, filterModality, sortField, sortDir]);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">History</h1>
          <p className="text-sm text-muted-foreground mt-0.5">All generation jobs</p>
        </div>
        <Link href="/dashboard/generate">
          <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white">
            <Sparkles className="w-4 h-4 mr-2" />
            Generate
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <select
          value={filterStatus}
          onChange={(e) => updateParam('status', e.target.value)}
          className="text-sm border border-border rounded-lg px-3 py-1.5 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          <option value="all">All statuses</option>
          <option value="queued">Queued</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
        <select
          value={filterModality}
          onChange={(e) => updateParam('modality', e.target.value)}
          className="text-sm border border-border rounded-lg px-3 py-1.5 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          <option value="all">All modalities</option>
          <option value="image">Images</option>
          <option value="video">Video</option>
          <option value="audio">Audio</option>
        </select>
        {(filterStatus !== 'all' || filterModality !== 'all') && (
          <button
            type="button"
            onClick={() => {
              const p = new URLSearchParams(searchParams.toString());
              p.delete('status'); p.delete('modality');
              router.replace(`?${p}`);
            }}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : generations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-100 to-blue-100 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-cyan-500" />
          </div>
          <div className="text-center">
            <p className="font-medium">No generations yet</p>
            <p className="text-sm text-muted-foreground mt-1">Your job history will appear here.</p>
          </div>
          <Link href="/dashboard/generate">
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white">
              <Sparkles className="w-4 h-4 mr-2" />
              Start generating
            </Button>
          </Link>
        </div>
      ) : displayed.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">No results match the current filters.</p>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 w-8"></th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Prompt</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 hidden sm:table-cell">Model</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Status</th>
                <th
                  className="text-right text-xs font-medium text-muted-foreground px-4 py-3 hidden md:table-cell cursor-pointer hover:text-foreground select-none"
                  onClick={() => toggleSort('cost_credits')}
                >
                  Cost <SortIcon field="cost_credits" active={sortField} dir={sortDir} />
                </th>
                <th
                  className="text-right text-xs font-medium text-muted-foreground px-4 py-3 cursor-pointer hover:text-foreground select-none"
                  onClick={() => toggleSort('created_at')}
                >
                  Date <SortIcon field="created_at" active={sortField} dir={sortDir} />
                </th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((gen, i) => {
                const ModalityIcon = MODALITY_ICON[gen.modality] ?? Image;
                const thumb = gen.assets[0]?.url;
                return (
                  <tr
                    key={gen.id}
                    className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${
                      i === displayed.length - 1 ? 'border-0' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-muted flex items-center justify-center shrink-0">
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={thumb} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <ModalityIcon className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-[280px]">
                      <p className="truncate text-foreground">{gen.prompt}</p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-muted-foreground">{gen.model_slug}</span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={gen.status} />
                    </td>
                    <td className="px-4 py-3 text-right hidden md:table-cell">
                      {gen.cost_credits != null ? (
                        <span className="text-muted-foreground">${Number(gen.cost_credits).toFixed(4)}</span>
                      ) : (
                        <span className="text-muted-foreground/30">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground/60 whitespace-nowrap">
                      {new Date(gen.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setAddToProjectGenId(gen.id)}
                        className="text-muted-foreground/40 hover:text-cyan-500 transition-colors"
                        aria-label="Add to project"
                      >
                        <FolderPlus className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <AddToProjectModal
        open={addToProjectGenId !== null}
        generationId={addToProjectGenId ?? ''}
        onClose={() => setAddToProjectGenId(null)}
      />
    </div>
  );
}

export default function HistoryPage() {
  return (
    <Suspense fallback={
      <div className="p-6 space-y-5">
        <Skeleton className="h-8 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-9 w-36" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        </div>
      </div>
    }>
      <HistoryPageInner />
    </Suspense>
  );
}
