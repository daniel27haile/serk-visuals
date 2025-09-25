// shared/models/project.model.ts
export type ProjectStatus = 'new' | 'in_progress' | 'completed' | 'delivered';

export interface Project {
  id?: string;
  title: string;
  clientName?: string | null;
  status: ProjectStatus;
  description?: string | null;

  startedAt?: string | null;
  dueAt?: string | null;
  deliveredAt?: string | null;

  coverUrl?: string | null;
  images?: string[];

  tags?: string[];

  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectListResponse {
  items: Project[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
}

export type ProjectCreateDto = Omit<Project, 'id' | 'createdAt' | 'updatedAt'>;
export type ProjectUpdateDto = Partial<ProjectCreateDto>;
