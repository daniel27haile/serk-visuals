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
  phone?: number; // schema uses Number
  type: BookingType;
  date: string; // ISO or "YYYY-MM-DD" (good for <input type="date">)
  message?: string;
  status?: BookingStatus; // defaults to 'new' server-side
  createdAt?: string;
  updatedAt?: string;
}
