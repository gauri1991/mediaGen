'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle, Clock, Loader2, Image, Video, Music, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { djangoApi } from '@/lib/api';
import { toast } from 'sonner';

interface Asset { id: string; url: string | null; type: string; }
interface Generation {
  id: string;
  modality: string;
  model_slug: string;
  status: string;
  prompt: string;
  cost_credits: number | null;
  error_message: string | null;
  created_at: string;
  assets: Asset[];
  note?: string;
}

const STATUS_MAP: Record<string, { label: string; icon: React.ElementType; classes: string }> = {
  queued:     { label: 'Queued',     icon: Clock,         classes: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  processing: { label: 'Processing', icon: Loader2,       classes: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30' },
  completed:  { label: 'Completed',  icon: CheckCircle2,  classes: 'bg-green-50 text-green-700 border-green-200' },
  failed:     { label: 'Failed',     icon: XCircle,       classes: 'bg-red-50 text-red-700 border-red-200' },
};

const MODALITY_ICON: Record<string, React.ElementType> = { image: Image, video: Video, audio: Music };

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

interface Props {
  projectId: string;
  generations: Generation[];
  onRemoved: (genId: string) => void;
}

export function ProjectGenerationTable({ projectId, generations, onRemoved }: Props) {
  const [removing, setRemoving] = useState<string | null>(null);

  async function handleRemove(genId: string) {
    setRemoving(genId);
    try {
      await djangoApi.removeGenerationFromProject(projectId, genId);
      onRemoved(genId);
      toast.success('Removed from project');
    } catch {
      toast.error('Failed to remove');
    } finally {
      setRemoving(null);
    }
  }

  if (generations.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-12">
        No generations added yet. Use &ldquo;Add generations&rdquo; to link some.
      </p>
    );
  }

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 w-8"></th>
            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Prompt</th>
            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 hidden sm:table-cell">Model</th>
            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Status</th>
            <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3 hidden md:table-cell">Cost</th>
            <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Date</th>
            <th className="w-8 px-2 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {generations.map((gen, i) => {
            const ModalityIcon = MODALITY_ICON[gen.modality] ?? Image;
            const thumb = gen.assets[0]?.url;
            return (
              <tr key={gen.id} className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${i === generations.length - 1 ? 'border-0' : ''}`}>
                <td className="px-4 py-3">
                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-muted flex items-center justify-center shrink-0">
                    {thumb
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={thumb} alt="" className="w-full h-full object-cover" />
                      : <ModalityIcon className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </td>
                <td className="px-4 py-3 max-w-[240px]">
                  <p className="truncate text-foreground">{gen.prompt}</p>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <span className="text-muted-foreground">{gen.model_slug}</span>
                </td>
                <td className="px-4 py-3"><StatusBadge status={gen.status} /></td>
                <td className="px-4 py-3 text-right hidden md:table-cell">
                  {gen.cost_credits != null
                    ? <span className="text-muted-foreground">${Number(gen.cost_credits).toFixed(4)}</span>
                    : <span className="text-muted-foreground/30">—</span>}
                </td>
                <td className="px-4 py-3 text-right text-muted-foreground/60 whitespace-nowrap">
                  {new Date(gen.created_at).toLocaleDateString()}
                </td>
                <td className="px-2 py-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500"
                    disabled={removing === gen.id}
                    onClick={() => handleRemove(gen.id)}
                    aria-label="Remove from project"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
