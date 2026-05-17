'use client';

import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { djangoApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { AssetTile } from '@/components/library/AssetTile';
import { AssetLightbox } from '@/components/library/AssetLightbox';
import { AddToProjectModal } from '@/components/projects/AddToProjectModal';
import Link from 'next/link';
import { Sparkles, Search } from 'lucide-react';

type AssetType = 'image' | 'video' | 'audio';

interface Asset {
  id: string;
  type: string;
  url: string | null;
  thumbnailR2Key: string | null;
  mimeType: string | null;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  generation: {
    id: string;
    prompt: string;
    modelSlug: string;
    modality: string;
    createdAt: string;
  };
}

interface ApiResponse {
  items: Asset[];
  nextCursor: string | null;
}

const FILTERS: { value: 'all' | AssetType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'image', label: 'Images' },
  { value: 'video', label: 'Videos' },
  { value: 'audio', label: 'Audio' },
];

interface FetchState {
  assets: Asset[];
  cursor: string | null;
  hasMore: boolean;
  loading: boolean;
}

function LibraryPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const filter = (searchParams.get('type') ?? 'all') as 'all' | AssetType;
  const urlSearch = searchParams.get('search') ?? '';

  const [searchInput, setSearchInput] = useState(urlSearch);
  const [state, setState] = useState<FetchState>({ assets: [], cursor: null, hasMore: false, loading: true });
  const [loadingMore, setLoadingMore] = useState(false);
  const [selected, setSelected] = useState<Asset | null>(null);
  const [addToProjectGenId, setAddToProjectGenId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function setFilter(f: 'all' | AssetType) {
    const p = new URLSearchParams(searchParams.toString());
    if (f === 'all') {
      p.delete('type');
    } else {
      p.set('type', f);
    }
    router.replace(`?${p}`);
    setState({ assets: [], cursor: null, hasMore: false, loading: true });
  }

  function commitSearch(value: string) {
    const p = new URLSearchParams(searchParams.toString());
    if (value) {
      p.set('search', value);
    } else {
      p.delete('search');
    }
    router.replace(`?${p}`);
    setState({ assets: [], cursor: null, hasMore: false, loading: true });
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => commitSearch(value), 300);
  }

  const fetchAssets = useCallback(async (
    type: 'all' | AssetType,
    search: string,
    afterCursor?: string | null,
  ) => {
    const result = await djangoApi.listAssets({
      type: type === 'all' ? undefined : type,
      limit: 48,
      cursor: afterCursor ?? undefined,
      search: search || undefined,
    });
    return result as ApiResponse;
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchAssets(filter, urlSearch).then((data) => {
      if (cancelled) return;
      setState({
        assets: data?.items ?? [],
        cursor: data?.nextCursor ?? null,
        hasMore: !!data?.nextCursor,
        loading: false,
      });
    });
    return () => { cancelled = true; };
  }, [filter, urlSearch, fetchAssets]);

  const loadMore = async () => {
    if (!state.cursor || loadingMore) return;
    setLoadingMore(true);
    const data = await fetchAssets(filter, urlSearch, state.cursor);
    if (data) {
      setState((prev) => ({
        ...prev,
        assets: [...prev.assets, ...data.items],
        cursor: data.nextCursor,
        hasMore: !!data.nextCursor,
      }));
    }
    setLoadingMore(false);
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Library</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Your generated media</p>
        </div>
        <Link href="/dashboard/generate">
          <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white">
            <Sparkles className="w-4 h-4 mr-2" />
            Generate
          </Button>
        </Link>
      </div>

      {/* Search + filter row */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={handleSearchChange}
            placeholder="Search by prompt…"
            className="pl-9 h-9 w-56 text-sm"
          />
        </div>
        <div className="flex gap-2">
          {FILTERS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={[
                'px-4 py-1.5 rounded-full text-sm font-medium border transition-all',
                filter === value
                  ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                  : 'border-border bg-card text-muted-foreground hover:border-border/60',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {state.loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {Array.from({ length: 18 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      ) : state.assets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-100 to-blue-100 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-cyan-500" />
          </div>
          <div className="text-center">
            <p className="font-medium">No media found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {urlSearch
                ? `No results for "${urlSearch}".`
                : filter === 'all'
                ? 'Generate something to see it here.'
                : `No ${filter}s yet.`}
            </p>
          </div>
          {!urlSearch && (
            <Link href="/dashboard/generate">
              <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white">
                <Sparkles className="w-4 h-4 mr-2" />
                Start generating
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {state.assets.map((asset) => (
              <AssetTile
                key={asset.id}
                asset={asset}
                onClick={() => setSelected(asset)}
                onAddToProject={(genId) => setAddToProjectGenId(genId)}
              />
            ))}
          </div>

          {state.hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={loadMore}
                disabled={loadingMore}
              >
                {loadingMore ? 'Loading…' : 'Load more'}
              </Button>
            </div>
          )}
        </>
      )}

      <AssetLightbox
        asset={selected}
        onClose={() => setSelected(null)}
        onAddToProject={(genId) => { setSelected(null); setAddToProjectGenId(genId); }}
      />

      <AddToProjectModal
        open={addToProjectGenId !== null}
        generationId={addToProjectGenId ?? ''}
        onClose={() => setAddToProjectGenId(null)}
      />
    </div>
  );
}

export default function LibraryPage() {
  return (
    <Suspense fallback={
      <div className="p-6 space-y-5">
        <Skeleton className="h-8 w-24" />
        <div className="flex gap-3">
          <Skeleton className="h-9 w-56" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-9 w-20 rounded-full" />)}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {Array.from({ length: 18 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-xl" />)}
        </div>
      </div>
    }>
      <LibraryPageInner />
    </Suspense>
  );
}
