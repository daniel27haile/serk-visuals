export type BookingType =
  | 'wedding'
  | 'event'
  | 'portrait'
  | 'product'
  | 'video';
export type BookingStatus = 'new' | 'confirmed' | 'completed' | 'cancelled';

export interface Booking {
  _id?: string;
  name: string;
  email: string;
  phone?: number; // backend expects Number; keep number here
  type?: BookingType;
  date?: string; // ISO string from <input type="date">
  message?: string;
  status?: BookingStatus; // default "new" on backend
  createdAt?: string;
  updatedAt?: string;
}

export interface BookingCreateDto
  extends Omit<Booking, '_id' | 'createdAt' | 'updatedAt'> {}
