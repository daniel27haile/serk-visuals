export type BookingType =
  | 'Portrait' | 'Family' | 'Wedding' | 'Event' | 'Graduation'
  | 'Real Estate' | 'Commercial' | 'Engagement'
  | 'Birthday' | 'Product' | 'Personal' | 'Other'
  // legacy lowercase (backward compat)
  | 'wedding' | 'event' | 'birthday' | 'product' | 'personal' | 'other';

export type BookingStatus = 'pending' | 'new' | 'confirmed' | 'completed' | 'cancelled';

export interface Booking {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  phone?: string | number;
  type?: BookingType;
  date?: string;             // ISO start
  end?: string;              // ISO end
  durationMinutes?: number;
  location?: string;
  numberOfPeople?: string;
  preferredContactMethod?: string;
  estimatedPrice?: number;
  bookingDetails?: Record<string, unknown>;
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
