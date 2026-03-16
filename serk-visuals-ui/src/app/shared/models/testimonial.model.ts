export interface Testimonial {
  _id?: string;
  author: string;
  quote: string;
  role?: string;
  published?: boolean;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
}

export interface TestimonialCreateDTO {
  author: string;
  quote: string;
  role?: string;
  published?: boolean;
  order?: number;
}

export interface TestimonialUpdateDTO {
  author?: string;
  quote?: string;
  role?: string;
  published?: boolean;
  order?: number;
}
