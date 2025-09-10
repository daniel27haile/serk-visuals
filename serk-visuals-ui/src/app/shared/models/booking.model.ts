export type BookingType =
  | 'wedding'
  | 'event'
  | 'birthday'
  | 'product'
  | 'personal'
  | 'other';

export type BookingStatus = 'new' | 'confirmed' | 'completed' | 'cancelled';

export interface Booking {
  _id?: string;
  name: string;
  email: string;
  phone?: number; // backend expects number
  type?: BookingType;
  date?: string; // ISO datetime
  message?: string;
  status?: BookingStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface BookingCreateDto
  extends Omit<Booking, '_id' | 'createdAt' | 'updatedAt'> {}
