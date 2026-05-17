'use client';

import { useState, useEffect } from 'react';
import { modelRegistry } from '@/lib/models/registry';
import Link from 'next/link';
import { Image, Video, Music, ExternalLink } from 'lucide-react';

const DJANGO = process.env.NEXT_PUBLIC_DJANGO_URL ?? 'http://localhost:8000';

const MODALITY_CONFIG = {
  image: { label: 'Image', icon: Image, classes: 'bg-blue-50 text-blue-700 border-blue-200' },
  video: { label: 'Video', icon: Video, classes: 'bg-purple-50 text-purple-700 border-purple-200' },
  audio: { label: 'Audio', icon: Music, classes: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200' },
};

const PROVIDER_LABELS: Record<string, string> = {
  replicate: 'Replicate',
  akashml: 'AkashML',
  modal: 'Modal',
  runpod: 'RunPod',
};

export default function ModelsPage() {
  const [providerStatus, setProviderStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch(`${DJANGO}/api/users/providers/status`)
      .then((r) => r.ok ? r.json() : {})
      .then((data) => setProviderStatus(data as Record<string, boolean>))
      .catch(() => {});
  }, []);

  const models = Object.entries(modelRegistry);
  const byModality = {
    image: models.filter(([, c]) => c.modality === 'image'),
    video: models.filter(([, c]) => c.modality === 'video'),
    audio: models.filter(([, c]) => c.modality === 'audio'),
  };

  return (
    <div className="p-6 space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Models</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Available AI models for generation</p>
      </div>

      {(Object.entries(byModality) as [keyof typeof byModality, typeof models][]).map(([modality, entries]) => {
        const cfg = MODALITY_CONFIG[modality];
        const Icon = cfg.icon;

        return (
          <div key={modality} className="space-y-3">
            <div className="flex items-center gap-2">
              <Icon className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-base font-semibold">{cfg.label}</h2>
              <span className="text-xs text-muted-foreground/60">{entries.length} model{entries.length !== 1 ? 's' : ''}</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {entries.map(([slug, model]) => (
                <div
                  key={slug}
                  className="rounded-xl border border-border bg-card p-4 space-y-3 hover:border-border/60 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm">{model.label}</p>
                      <p className="text-xs text-muted-foreground/60 font-mono mt-0.5">{slug}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.classes}`}>
                      {cfg.label}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {Object.entries(model.providers).map(([provider, info]) => {
                      const available = providerStatus[provider];
                      return (
                        <div
                          key={provider}
                          className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted/50 border border-border"
                          title={available === undefined ? 'Checking…' : available ? 'API key configured' : 'API key not set'}
                        >
                          <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${
                            available === undefined
                              ? 'bg-muted-foreground/30'
                              : available
                              ? 'bg-green-400'
                              : 'bg-muted-foreground/20'
                          }`} />
                          <span className="text-xs font-medium text-foreground">{PROVIDER_LABELS[provider] ?? provider}</span>
                          {info && (
                            <span className="text-xs text-muted-foreground/60">${info.costEstimate.toFixed(3)}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <Link
                    href={`/dashboard/generate?model=${slug}`}
                    className="inline-flex items-center gap-1 text-xs text-cyan-600 hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Generate with this model
                  </Link>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
