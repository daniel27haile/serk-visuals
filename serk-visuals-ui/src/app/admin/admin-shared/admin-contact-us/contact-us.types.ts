export interface ContactItem {
  id: string;
  fullName: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied';
  reply?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContactListResponse {
  items: ContactItem[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
}
