'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { djangoApi } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, X } from 'lucide-react';
import type { Project } from '@/lib/types/project';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  status: z.enum(['draft', 'active']),
  deadline: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: (project: Project) => void;
  project?: Project; // if provided, edit mode
}

export function CreateProjectModal({ open, onClose, onSaved, project }: Props) {
  const isEdit = !!project;
  const [tags, setTags] = useState<string[]>(project?.tags ?? []);
  const [tagInput, setTagInput] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: project?.name ?? '',
      description: project?.description ?? '',
      status: (project?.status === 'active' ? 'active' : 'draft') as 'draft' | 'active',
      deadline: project?.deadline ?? '',
    },
  });

  function addTag(val: string) {
    const t = val.trim().toLowerCase().replace(/\s+/g, '-');
    if (t && !tags.includes(t) && tags.length < 10) {
      setTags([...tags, t]);
    }
    setTagInput('');
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  async function onSubmit(data: FormData) {
    try {
      const body = {
        name: data.name,
        description: data.description ?? '',
        status: data.status,
        tags,
        deadline: data.deadline || undefined,
      };
      let saved: Project;
      if (isEdit) {
        saved = await djangoApi.updateProject(project.id, body) as Project;
        toast.success('Project updated');
      } else {
        saved = await djangoApi.createProject(body) as Project;
        toast.success('Project created');
      }
      onSaved(saved);
      reset();
      setTags([]);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save project');
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit project' : 'New project'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="Q4 Campaign" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Brief <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Textarea id="description" placeholder="Creative direction, goals, mood…" rows={3} className="resize-none text-sm" {...register('description')} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <select id="status" {...register('status')}
                className="w-full text-sm border border-border rounded-lg px-3 py-1.5 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500">
                <option value="draft">Draft</option>
                <option value="active">Active</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="deadline">Deadline <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input id="deadline" type="date" {...register('deadline')} className="text-sm" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              {tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 text-xs bg-cyan-50 text-cyan-700 border border-cyan-200 px-2 py-0.5 rounded-full">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500"><X className="w-2.5 h-2.5" /></button>
                </span>
              ))}
            </div>
            <Input
              placeholder="Add tag, press Enter…"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput); }
                if (e.key === ',') { e.preventDefault(); addTag(tagInput); }
              }}
              className="text-sm"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={isSubmitting}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : isEdit ? 'Save changes' : 'Create project'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
