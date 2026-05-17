'use client';

import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Asset {
  id: string;
  type: string;
  url: string | null;
  mime_type?: string | null;
  mimeType?: string | null;
  width: number | null;
  height: number | null;
}

interface AssetPreviewProps {
  assets: Asset[];
}

export function AssetPreview({ assets }: AssetPreviewProps) {
  if (!assets.length) return null;

  return (
    <div className="space-y-3">
      {assets.map((asset) => (
        <div key={asset.id} className="relative group rounded-xl overflow-hidden bg-neutral-900">
          {asset.type === 'image' && asset.url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={asset.url}
              alt="Generated image"
              className="w-full h-auto max-h-[600px] object-contain"
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
              className="w-full h-auto max-h-[600px]"
            />
          )}

          {asset.type === 'audio' && asset.url && (
            <div className="p-6 flex flex-col items-center gap-3">
              <div className="waveform-canvas w-full h-16 bg-neutral-800 rounded-lg" />
              <audio src={asset.url} controls className="w-full" />
            </div>
          )}

          {asset.url && (
            <a
              href={asset.url}
              download
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
                <Download className="w-3.5 h-3.5" />
              </Button>
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
