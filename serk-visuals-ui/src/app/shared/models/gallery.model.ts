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
  url: string;
  thumbnail?: string;
  tags?: string[];
  published?: boolean;
  placement?: Placement;
  order?: number;
  isCover?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/** Summary returned by GET /api/gallery/albums, grouped by placement+album */
export interface AlbumSummary {
  placement: Placement;
  album: Album;
  count: number;
  publishedCount: number;
  coverUrl: string | null;
  coverThumbUrl: string | null;
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
}
