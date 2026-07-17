export type PropertyType =
  | 'Residential'
  | 'Luxury'
  | 'Condo'
  | 'Townhome'
  | 'Commercial'
  | 'Vacant Land'
  | 'Other';

export interface REPortfolioImage {
  _id: string;
  imageKey: string;
  thumbKey?: string;
  url: string;
  thumbnail?: string;
  alt: string;
  order: number;
}

export interface REPortfolioProject {
  _id: string;
  title: string;
  slug: string;
  coverImageKey: string;
  coverUrl: string;
  coverThumbKey?: string;
  coverThumbUrl?: string;
  images: REPortfolioImage[];
  propertyType: PropertyType;
  location?: string;
  description?: string;
  featured: boolean;
  published: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface REPortfolioPaged {
  items: REPortfolioProject[];
  total: number;
  page: number;
  pages: number;
}
