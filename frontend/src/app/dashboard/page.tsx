'use client';

import { useState, useEffect } from 'react';
import { Sparkles, ImageIcon, Video, Music, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { djangoApi } from '@/lib/api';

interface Asset {
  id: string;
  url: string | null;
  type: string;
}

interface Generation {
  id: string;
  modality: string;
  model_slug: string;
  status: string;
  prompt: string;
  created_at: string;
  assets: Asset[];
}

interface UsageSummary {
  total: number;
  total_cost: number;
  completed: number;
  failed: number;
}

const MODALITY_ICON: Record<string, React.ElementType> = {
  image: ImageIcon,
  video: Video,
  audio: Music,
};

const MODALITY_COLOR: Record<string, string> = {
  image: 'from-cyan-500/10 to-cyan-600/5',
  video: 'from-blue-500/10 to-blue-600/5',
  audio: 'from-magenta-500/10 to-magenta-600/5',
};

const MODALITY_ICON_COLOR: Record<string, string> = {
  image: 'text-cyan-500',
  video: 'text-blue-500',
  audio: 'text-magenta-500',
};

export default function DashboardPage() {
  const [recentGens, setRecentGens] = useState<Generation[]>([]);
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      djangoApi.listGenerations({ limit: 6, status: 'completed' }),
      djangoApi.usageSummary(),
    ]).then(([gens, u]) => {
      if (cancelled) return;
      setRecentGens(gens as Generation[]);
      setUsage(u as UsageSummary);
      setLoading(false);
    }).catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground mt-1">Your media generation studio</p>
      </div>

      {/* Stats row */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
      ) : usage && usage.total > 0 ? (
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total jobs</p>
            <p className="text-2xl font-bold mt-1">{usage.total}</p>
            <p className="text-xs text-muted-foreground/60 mt-0.5">{usage.completed} completed</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total cost</p>
            <p className="text-2xl font-bold mt-1">${usage.total_cost.toFixed(4)}</p>
            <p className="text-xs text-muted-foreground/60 mt-0.5">all time</p>
          </div>
        </div>
      ) : null}

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Quick start</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { href: '/dashboard/generate?mode=image', icon: ImageIcon, label: 'Generate image', color: 'from-cyan-500/10 to-cyan-600/5', iconColor: 'text-cyan-500', ring: 'ring-cyan-500/20' },
            { href: '/dashboard/generate?mode=video', icon: Video, label: 'Generate video', color: 'from-blue-500/10 to-blue-600/5', iconColor: 'text-blue-500', ring: 'ring-blue-500/20' },
            { href: '/dashboard/generate?mode=audio', icon: Music, label: 'Generate audio', color: 'from-magenta-500/10 to-magenta-600/5', iconColor: 'text-magenta-500', ring: 'ring-magenta-500/20' },
          ].map(({ href, icon: Icon, label, color, iconColor, ring }) => (
            <Link
              key={href}
              href={href}
              className={`group flex items-center gap-4 rounded-xl border bg-gradient-to-br ${color} p-5 ring-1 ring-inset ${ring} hover:shadow-md transition-shadow`}
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background/80 ${iconColor}`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-sm font-semibold">{label}</span>
              <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
            </Link>
          ))}
        </div>
      </div>

      {/* Recent generations */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Recent generations</h2>
          <Link href="/dashboard/library" className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
          </div>
        ) : recentGens.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {recentGens.map((gen) => {
              const thumb = gen.assets[0]?.url;
              const Icon = MODALITY_ICON[gen.modality] ?? ImageIcon;
              const gradColor = MODALITY_COLOR[gen.modality] ?? 'from-neutral-100 to-neutral-50';
              const iconColor = MODALITY_ICON_COLOR[gen.modality] ?? 'text-neutral-400';
              return (
                <Link
                  key={gen.id}
                  href="/dashboard/library"
                  className="group relative aspect-square rounded-xl overflow-hidden border border-border bg-muted/50 hover:shadow-md transition-shadow"
                >
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumb} alt={gen.prompt} className="w-full h-full object-cover" />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${gradColor}`}>
                      <Icon className={`w-6 h-6 ${iconColor}`} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  <div className="absolute bottom-0 left-0 right-0 p-2 translate-y-full group-hover:translate-y-0 transition-transform bg-gradient-to-t from-black/60 to-transparent">
                    <p className="text-white text-xs truncate">{gen.prompt}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border bg-muted/30 p-12 flex flex-col items-center justify-center text-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-600/10 ring-1 ring-inset ring-cyan-500/20">
              <Sparkles className="h-6 w-6 text-cyan-500" />
            </div>
            <p className="text-sm font-medium">No generations yet</p>
            <p className="text-xs text-muted-foreground">Your recent work will appear here</p>
            <Link href="/dashboard/generate" className="mt-2 inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white transition-all">
              Start generating
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
