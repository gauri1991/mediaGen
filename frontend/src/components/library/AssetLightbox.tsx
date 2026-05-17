'use client';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, X, ExternalLink, FolderPlus } from 'lucide-react';
import Link from 'next/link';

interface LightboxAsset {
  id: string;
  type: string;
  url: string | null;
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

interface AssetLightboxProps {
  asset: LightboxAsset | null;
  onClose: () => void;
  onAddToProject?: (generationId: string) => void;
}

export function AssetLightbox({ asset, onClose, onAddToProject }: AssetLightboxProps) {
  if (!asset) return null;

  const date = new Date(asset.generation.createdAt).toLocaleString();
  const dims = asset.width && asset.height ? `${asset.width} × ${asset.height}` : null;

  return (
    <Dialog open={!!asset} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-4xl w-full p-0 overflow-hidden bg-neutral-950 border-neutral-800">
        {/* Media */}
        <div className="relative bg-neutral-900 flex items-center justify-center min-h-[300px] max-h-[70vh]">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {asset.type === 'image' && asset.url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={asset.url}
              alt={asset.generation.prompt}
              className="max-w-full max-h-[70vh] object-contain"
            />
          )}

          {asset.type === 'video' && asset.url && (
            <video
              src={asset.url}
              controls
              autoPlay
              loop
              muted
              playsInline
              className="max-w-full max-h-[70vh]"
            />
          )}

          {asset.type === 'audio' && asset.url && (
            <div className="p-8 flex flex-col items-center gap-4 w-full">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-magenta-500/20 to-cyan-500/20 flex items-center justify-center">
                <span className="text-2xl">♪</span>
              </div>
              <audio src={asset.url} controls className="w-full max-w-md" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4 bg-neutral-950 text-white space-y-3">
          <p className="text-sm leading-relaxed text-neutral-200 line-clamp-3">
            {asset.generation.prompt}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="bg-neutral-800 text-neutral-300 border-0 text-xs">
              {asset.generation.modelSlug}
            </Badge>
            {dims && (
              <Badge variant="secondary" className="bg-neutral-800 text-neutral-300 border-0 text-xs">
                {dims}
              </Badge>
            )}
            <span className="text-xs text-neutral-500 ml-auto">{date}</span>
          </div>

          <div className="flex gap-2 pt-1 flex-wrap">
            {asset.url && (
              <a href={asset.url} download>
                <Button size="sm" variant="secondary" className="bg-neutral-800 text-white hover:bg-neutral-700 border-0">
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Download
                </Button>
              </a>
            )}
            <Link href={`/dashboard/generate?from=${asset.generation.id}`}>
              <Button size="sm" variant="secondary" className="bg-neutral-800 text-white hover:bg-neutral-700 border-0">
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                Open in Generate
              </Button>
            </Link>
            {onAddToProject && (
              <Button
                size="sm"
                variant="secondary"
                className="bg-neutral-800 text-white hover:bg-cyan-600 border-0"
                onClick={() => { onAddToProject(asset.generation.id); onClose(); }}
              >
                <FolderPlus className="w-3.5 h-3.5 mr-1.5" />
                Add to project
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
