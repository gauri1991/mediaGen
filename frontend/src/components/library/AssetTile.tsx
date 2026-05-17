'use client';

import { Play, Music, FolderPlus } from 'lucide-react';

interface TileAsset {
  id: string;
  type: string;
  url: string | null;
  thumbnailR2Key: string | null;
  width: number | null;
  height: number | null;
  generation: {
    id: string;
    prompt: string;
    modelSlug: string;
    createdAt: string;
  };
}

interface AssetTileProps {
  asset: TileAsset;
  onClick: () => void;
  onAddToProject?: (generationId: string) => void;
}

const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? '';

function thumbnailUrl(asset: TileAsset): string | null {
  if (asset.thumbnailR2Key && R2_PUBLIC_URL) {
    return `${R2_PUBLIC_URL}/${asset.thumbnailR2Key}`;
  }
  if (asset.type === 'image' && asset.url) return asset.url;
  return null;
}

export function AssetTile({ asset, onClick, onAddToProject }: AssetTileProps) {
  const thumb = thumbnailUrl(asset);
  const date = new Date(asset.generation.createdAt).toLocaleDateString();

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative aspect-square rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 hover:border-cyan-400 hover:shadow-lg transition-all text-left"
    >
      {/* Thumbnail */}
      {asset.type === 'image' && thumb && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumb}
          alt={asset.generation.prompt}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      )}

      {asset.type === 'video' && (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-900 to-neutral-900">
          {thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumb} alt="" className="w-full h-full object-cover absolute inset-0" loading="lazy" />
          ) : null}
          <div className="relative z-10 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Play className="w-4 h-4 text-white fill-white ml-0.5" />
          </div>
        </div>
      )}

      {asset.type === 'audio' && (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-magenta-900 to-neutral-900">
          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Music className="w-4 h-4 text-white" />
          </div>
        </div>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
        {onAddToProject && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onAddToProject(asset.generation.id); }}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-cyan-500/80 transition-colors"
            aria-label="Add to project"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
        )}
        <p className="text-white text-xs font-medium line-clamp-2 leading-tight">
          {asset.generation.prompt}
        </p>
        <p className="text-white/60 text-[10px] mt-1">{asset.generation.modelSlug} · {date}</p>
      </div>
    </button>
  );
}
