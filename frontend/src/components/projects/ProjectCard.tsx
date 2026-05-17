'use client';

import Link from 'next/link';
import { CalendarDays } from 'lucide-react';
import { ProjectStatusBadge } from './ProjectStatusBadge';
import type { Project } from '@/lib/types/project';

// Captured at module-load time so it's stable across renders
const PAGE_LOAD_TIME = Date.now();

function DeadlineChip({ deadline }: { deadline: string }) {
  const days = Math.ceil((new Date(deadline).getTime() - PAGE_LOAD_TIME) / 86400000);
  const overdue = days < 0;
  return (
    <div className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${
      overdue ? 'bg-red-50 text-red-600 border-red-200' : 'bg-muted text-muted-foreground border-border'
    }`}>
      <CalendarDays className="w-3 h-3" />
      {overdue ? `${Math.abs(days)}d overdue` : `${days}d left`}
    </div>
  );
}

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      href={`/dashboard/projects/${project.id}`}
      className="group rounded-xl border border-border bg-card hover:border-border/60 hover:shadow-md transition-all overflow-hidden flex flex-col"
    >
      {/* Cover */}
      <div className="h-40 bg-gradient-to-br from-cyan-500/10 to-blue-600/5 relative overflow-hidden shrink-0">
        {project.cover_asset?.url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={project.cover_asset.url} alt="" className="w-full h-full object-cover" />
        )}
        <div className="absolute top-2 right-2">
          <ProjectStatusBadge status={project.status} />
        </div>
        {project.tags.length > 0 && (
          <div className="absolute bottom-2 left-2 flex gap-1 flex-wrap">
            {project.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-[10px] bg-black/40 text-white px-1.5 py-0.5 rounded-full backdrop-blur-sm">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 space-y-3 flex-1 flex flex-col">
        <div className="flex-1">
          <p className="font-semibold text-sm truncate">{project.name}</p>
          {project.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{project.description}</p>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{project.generation_count} job{project.generation_count !== 1 ? 's' : ''}</span>
          <span>{project.asset_count} asset{project.asset_count !== 1 ? 's' : ''}</span>
          <span className="ml-auto font-medium text-foreground">${project.total_cost.toFixed(3)}</span>
        </div>

        {project.deadline && <DeadlineChip deadline={project.deadline} />}
      </div>
    </Link>
  );
}
