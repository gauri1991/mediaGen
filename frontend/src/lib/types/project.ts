export interface ProjectAsset {
  id: string;
  url: string | null;
  type: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'review' | 'complete' | 'archived';
  tags: string[];
  deadline: string | null;
  cover_asset: ProjectAsset | null;
  created_at: string;
  updated_at: string;
  generation_count: number;
  asset_count: number;
  total_cost: number;
}

export interface ProjectStats {
  generation_count: number;
  asset_count: number;
  total_cost: number;
  by_modality: { modality: string; count: number; cost: number }[];
  by_status: { status: string; count: number }[];
}
