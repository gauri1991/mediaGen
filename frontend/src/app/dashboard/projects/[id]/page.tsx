'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, MoreHorizontal, Pencil, Trash2, Plus,
  Image, Video, Music, CalendarDays,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub,
  DropdownMenuSubTrigger, DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import { djangoApi } from '@/lib/api';
import { toast } from 'sonner';
import { ProjectStatusBadge } from '@/components/projects/ProjectStatusBadge';
import { CreateProjectModal } from '@/components/projects/CreateProjectModal';
import { ProjectAssetGrid } from '@/components/projects/ProjectAssetGrid';
import { ProjectGenerationTable } from '@/components/projects/ProjectGenerationTable';
import { ProjectBrief } from '@/components/projects/ProjectBrief';
import type { Project, ProjectStats } from '@/lib/types/project';

const MODALITY_ICON: Record<string, React.ElementType> = {
  image: Image,
  video: Video,
  audio: Music,
};

function StatCard({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {sub && <p className="text-xs text-muted-foreground/60 mt-0.5">{sub}</p>}
    </div>
  );
}

const STATUS_OPTIONS = [
  { value: 'draft',    label: 'Draft' },
  { value: 'active',   label: 'Active' },
  { value: 'review',   label: 'In Review' },
  { value: 'complete', label: 'Complete' },
  { value: 'archived', label: 'Archived' },
];

interface Generation {
  id: string;
  modality: string;
  model_slug: string;
  status: string;
  prompt: string;
  cost_credits: number | null;
  error_message: string | null;
  created_at: string;
  assets: { id: string; url: string | null; type: string }[];
}

// Captured at module-load time so it's stable across renders
const PAGE_LOAD_TIME = Date.now();

function deadlineInfo(deadline: string) {
  const days = Math.ceil((new Date(deadline).getTime() - PAGE_LOAD_TIME) / 86400000);
  return { days, overdue: days < 0 };
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      djangoApi.getProject(id),
      djangoApi.getProjectStats(id),
    ]).then(([p, s]) => {
      if (cancelled) return;
      setProject(p as Project);
      setStats(s as ProjectStats);
      setLoading(false);
    }).catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  // Load generations for the table tab
  useEffect(() => {
    import('@/lib/api').then(({ djangoApi: api }) =>
      api.listGenerations({ limit: 100 })
    ).then((data) => {
      setGenerations(data as Generation[]);
    }).catch(() => {});
  }, [id]);

  function handleAddGens() {
    toast.info('Go to History or Library and use the add button to link generations to this project.');
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${project?.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await djangoApi.deleteProject(id);
      toast.success('Project deleted');
      router.push('/dashboard/projects');
    } catch {
      toast.error('Failed to delete project');
      setDeleting(false);
    }
  }

  async function handleStatusChange(status: string) {
    if (!project) return;
    try {
      const updated = await djangoApi.updateProject(id, { status }) as Project;
      setProject(updated);
      toast.success(`Status changed to ${status}`);
    } catch {
      toast.error('Failed to update status');
    }
  }

  async function handleSaveBrief(description: string) {
    const updated = await djangoApi.updateProject(id, { description }) as Project;
    setProject(updated);
    toast.success('Brief saved');
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Project not found.</p>
        <Link
          href="/dashboard/projects"
          className="text-cyan-600 hover:underline text-sm mt-2 inline-block"
        >
          Back to projects
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      {/* Breadcrumb */}
      <Link
        href="/dashboard/projects"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Projects
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight truncate">{project.name}</h1>
            <ProjectStatusBadge status={project.status} />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full"
              >
                {tag}
              </span>
            ))}
            {project.deadline && (() => {
              const { days, overdue } = deadlineInfo(project.deadline!);
              return (
                <div
                  className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${
                    overdue
                      ? 'bg-red-50 text-red-600 border-red-200'
                      : 'bg-muted text-muted-foreground border-border'
                  }`}
                >
                  <CalendarDays className="w-3 h-3" />
                  {overdue ? `${Math.abs(days)}d overdue` : `${days}d left`}
                </div>
              );
            })()}
            <span className="text-xs text-muted-foreground/60">
              Updated {new Date(project.updated_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            onClick={handleAddGens}
            variant="outline"
            size="sm"
            className="hidden sm:flex"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add generations
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="w-9 px-0">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setShowEdit(true)}>
                <Pencil className="w-4 h-4 mr-2" />
                Edit project
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Change status</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {STATUS_OPTIONS.map(({ value, label }) => (
                    <DropdownMenuItem
                      key={value}
                      onClick={() => handleStatusChange(value)}
                      className={project.status === value ? 'font-medium text-cyan-600' : ''}
                    >
                      {label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {deleting ? 'Deleting…' : 'Delete project'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
        {/* Left — stats */}
        <div className="space-y-3">
          <StatCard label="Total cost" value={`$${(stats?.total_cost ?? 0).toFixed(4)}`} />
          <StatCard label="Generations" value={stats?.generation_count ?? 0} />
          <StatCard label="Assets" value={stats?.asset_count ?? 0} />

          {stats && stats.by_modality.length > 0 && (
            <div className="rounded-xl border border-border bg-card divide-y divide-border px-4">
              {stats.by_modality.map(({ modality, count, cost }) => {
                const Icon = MODALITY_ICON[modality] ?? Image;
                return (
                  <div key={modality} className="flex items-center gap-3 py-3">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm capitalize flex-1">{modality}</span>
                    <span className="text-sm font-medium">{count}</span>
                    <span className="text-xs text-muted-foreground/60 w-16 text-right">
                      ${cost.toFixed(3)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <Button
            onClick={handleAddGens}
            variant="outline"
            className="w-full sm:hidden"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add generations
          </Button>
        </div>

        {/* Right — tabs */}
        <Tabs defaultValue="assets" className="space-y-4">
          <TabsList>
            <TabsTrigger value="assets">Assets</TabsTrigger>
            <TabsTrigger value="generations">Generations</TabsTrigger>
            <TabsTrigger value="brief">Brief</TabsTrigger>
          </TabsList>

          <TabsContent value="assets">
            <ProjectAssetGrid projectId={id} />
          </TabsContent>

          <TabsContent value="generations">
            <ProjectGenerationTable
              projectId={id}
              generations={generations}
              onRemoved={(genId) =>
                setGenerations((prev) => prev.filter((g) => g.id !== genId))
              }
            />
          </TabsContent>

          <TabsContent value="brief">
            <div className="rounded-xl border border-border bg-card p-5">
              <ProjectBrief
                description={project.description}
                onSave={handleSaveBrief}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit modal */}
      <CreateProjectModal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        project={project}
        onSaved={(updated) => {
          setProject(updated);
          setShowEdit(false);
        }}
      />
    </div>
  );
}
