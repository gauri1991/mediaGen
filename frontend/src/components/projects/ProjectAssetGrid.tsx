'use client';

import { useState, useEffect, useCallback } from 'react';
import { djangoApi } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AssetTile } from '@/components/library/AssetTile';
import { AssetLightbox } from '@/components/library/AssetLightbox';
import { Sparkles } from 'lucide-react';

interface Asset {
  id: string;
  type: string;
  url: string | null;
  thumbnailR2Key: string | null;
  mimeType: string | null;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  generation: { id: string; prompt: string; modelSlug: string; modality: string; createdAt: string };
}

interface ApiResponse { items: Asset[]; nextCursor: string | null; }

export function ProjectAssetGrid({ projectId }: { projectId: string }) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selected, setSelected] = useState<Asset | null>(null);

  const fetchAssets = useCallback(async (afterCursor?: string | null) => {
    const result = await djangoApi.listProjectAssets(projectId, {
      limit: 48,
      cursor: afterCursor ?? undefined,
    }) as ApiResponse;
    return result;
  }, [projectId]);

  useEffect(() => {
    let cancelled = false;
    fetchAssets().then((data) => {
      if (cancelled) return;
      setAssets(data?.items ?? []);
      setCursor(data?.nextCursor ?? null);
      setHasMore(!!data?.nextCursor);
      setLoading(false);
    }).catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [fetchAssets]);

  async function loadMore() {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    const data = await fetchAssets(cursor);
    setAssets((prev) => [...prev, ...(data?.items ?? [])]);
    setCursor(data?.nextCursor ?? null);
    setHasMore(!!data?.nextCursor);
    setLoadingMore(false);
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-xl" />)}
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-100 to-blue-100 flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-cyan-500" />
        </div>
        <div>
          <p className="font-medium text-sm">No assets yet</p>
          <p className="text-xs text-muted-foreground mt-1">Add generations to this project to see their assets here.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {assets.map((asset) => (
          <AssetTile key={asset.id} asset={asset} onClick={() => setSelected(asset)} />
        ))}
      </div>
      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? 'Loading…' : 'Load more'}
          </Button>
        </div>
      )}
      <AssetLightbox asset={selected} onClose={() => setSelected(null)} />
    </>
  );
}
