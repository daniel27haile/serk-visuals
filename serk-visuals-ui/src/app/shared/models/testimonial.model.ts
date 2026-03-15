// API model (what the server returns)
export interface Testimonial {
  _id?: string;
  author: string;
  quote: string;
  role?: string;
  avatar?: string; // URL string returned by API
  published?: boolean;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
}

// Paged wrapper
export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
}

// DTOs (what we send to the server — pass avatarKey from S3, not the raw File)
export interface TestimonialCreateDTO {
  author: string;
  quote: string;
  role?: string;
  published?: boolean;
  order?: number;
  avatarKey?: string; // S3 key obtained via UploadService
}

export interface TestimonialUpdateDTO {
  author?: string;
  quote?: string;
  role?: string;
  published?: boolean;
  order?: number;
  avatarKey?: string; // S3 key obtained via UploadService
}
