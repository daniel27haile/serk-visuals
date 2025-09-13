// src/app/shared/models/gallery.model.ts
export type Album =
  | 'Wedding'
  | 'Event'
  | 'Birthday'
  | 'Product'
  | 'Personal'
  | 'Other';

export type Placement = 'gallery' | 'slider' | 'featured';

export interface GalleryItem {
  _id?: string;
  title: string;
  album: Album;
  url: string; // absolute from API
  thumbnail?: string; // absolute from API
  tags?: string[];
  published?: boolean;
  placement?: Placement; // 👈 new
  order?: number; // 👈 new
  createdAt?: string;
  updatedAt?: string;
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
}
