'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { djangoApi } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { ProjectStatusBadge } from './ProjectStatusBadge';
import type { Project } from '@/lib/types/project';

interface Props {
  open: boolean;
  onClose: () => void;
  generationId: string;
}

export function AddToProjectModal({ open, onClose, generationId }: Props) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!open) return;
    djangoApi.listProjects()
      .then((data) => { setProjects(data as Project[]); setLoading(false); })
      .catch(() => setLoading(false));
  }, [open]);

  async function handleAdd() {
    if (!selected) return;
    setAdding(true);
    try {
      await djangoApi.addGenerationsToProject(selected, [generationId], note);
      toast.success('Added to project');
      onClose();
      setSelected(null);
      setNote('');
    } catch {
      toast.error('Failed to add to project');
    } finally {
      setAdding(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add to project</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}
            </div>
          ) : projects.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No projects yet. Create one first.</p>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {projects.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelected(p.id)}
                  className={`w-full flex items-center justify-between rounded-lg border px-3 py-2 text-left transition-all ${
                    selected === p.id
                      ? 'border-cyan-500 bg-cyan-500/10'
                      : 'border-border hover:border-border/60 hover:bg-muted/30'
                  }`}
                >
                  <span className="text-sm font-medium truncate">{p.name}</span>
                  <ProjectStatusBadge status={p.status} />
                </button>
              ))}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Note (optional)</label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Director's note for this take…"
              rows={2}
              className="text-sm resize-none"
            />
          </div>

          <div className="flex gap-2">
            <Button
              className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
              disabled={!selected || adding}
              onClick={handleAdd}
            >
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add to project'}
            </Button>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
