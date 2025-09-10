export type Album =
  | 'wedding'
  | 'event'
  | 'birthday'
  | 'product'
  | 'personal'
  | 'other';

export interface GalleryItem {
  _id?: string;
  title: string;
  album: Album;
  url: string; // now absolute from API
  thumbnail?: string; // now absolute from API (if present)
  tags?: string[];
  published?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
}
