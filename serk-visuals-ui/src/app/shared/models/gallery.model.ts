export type Album = 'wedding' | 'event' | 'birthday' | 'product' | 'personal' | 'other';

export interface GalleryItem {
  _id?: string;
  title: string;
  album: Album;
  url: string;
  thumbnail?: string;
  tags?: string[];
  published?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
