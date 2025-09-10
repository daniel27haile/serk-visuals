export type BookingType =
  | 'wedding'
  | 'event'
  | 'birthday'
  | 'product'
  | 'personal'
  | 'other';

export type BookingStatus = 'new' | 'confirmed' | 'completed' | 'cancelled';

export interface Booking {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  phone?: string | number; // may arrive as number; UI may set string
  type?: BookingType;
  date?: string; // ISO
  message?: string;
  status?: BookingStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface ContactMessage {
  id?: string;
  _id?: string;
  fullName: string;
  email: string;
  subject: string;
  message: string;
  createdAt?: string;
  meta?: { ip?: string; userAgent?: string; referrer?: string };
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page?: number;
  pages?: number;
}
