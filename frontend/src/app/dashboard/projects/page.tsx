'use client';

import { useState, useEffect } from 'react';
import { FolderOpen, Plus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { djangoApi } from '@/lib/api';
import type { Project } from '@/lib/types/project';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { CreateProjectModal } from '@/components/projects/CreateProjectModal';

const STATUS_FILTERS = [
  { value: 'all',      label: 'All' },
  { value: 'active',   label: 'Active' },
  { value: 'draft',    label: 'Draft' },
  { value: 'review',   label: 'In Review' },
  { value: 'complete', label: 'Complete' },
  { value: 'archived', label: 'Archived' },
];

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    let cancelled = false;
    djangoApi
      .listProjects(statusFilter !== 'all' ? { status: statusFilter } : undefined)
      .then((data) => {
        if (!cancelled) {
          setProjects(data as Project[]);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [statusFilter]);

  const totalCost = projects.reduce((s, p) => s + (p.total_cost ?? 0), 0);
  const totalJobs = projects.reduce((s, p) => s + (p.generation_count ?? 0), 0);
  const totalAssets = projects.reduce((s, p) => s + (p.asset_count ?? 0), 0);

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Organise your generations into creative campaigns
          </p>
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700 shrink-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          New project
        </Button>
      </div>

      {/* Stats strip */}
      {!loading && projects.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Projects',    value: projects.length },
            { label: 'Total jobs',  value: totalJobs },
            { label: 'Total assets',value: totalAssets },
            { label: 'Total cost',  value: `$${totalCost.toFixed(3)}` },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                {label}
              </p>
              <p className="text-2xl font-bold mt-1">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setStatusFilter(value)}
            className={[
              'px-3 py-1.5 rounded-full text-sm font-medium border transition-all',
              statusFilter === value
                ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                : 'border-border bg-card text-muted-foreground hover:border-border/60',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-100 to-blue-100 flex items-center justify-center">
            <FolderOpen className="w-8 h-8 text-cyan-500" />
          </div>
          <div>
            <p className="font-semibold">
              {statusFilter === 'all' ? 'No projects yet' : `No ${statusFilter} projects`}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {statusFilter === 'all'
                ? 'Create a project to organise your generations into campaigns.'
                : 'Try a different filter.'}
            </p>
          </div>
          {statusFilter === 'all' && (
            <Button
              onClick={() => setShowCreate(true)}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create your first project
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      <CreateProjectModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSaved={(p) => {
          setProjects((prev) => [p, ...prev]);
          setShowCreate(false);
        }}
      />
    </div>
  );
}
