import { FolderOpen } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export default function ProjectsPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
      </div>
      <EmptyState
        icon={FolderOpen}
        title="Coming soon"
        description="Organize your generations into projects for easier management."
      />
    </div>
  );
}
