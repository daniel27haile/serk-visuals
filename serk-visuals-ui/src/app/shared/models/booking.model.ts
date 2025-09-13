export type BookingType =
  | 'Wedding'
  | 'Event'
  | 'Birthday'
  | 'Product'
  | 'Personal'
  | 'Other';

export type BookingStatus = 'new' | 'confirmed' | 'completed' | 'cancelled';

export interface Booking {
  _id?: string;
  name: string;
  email: string;
  phone?: number; // keep Number to match backend for now
  type?: BookingType;

  date?: string; // ISO start
  end?: string; // ISO end
  durationMinutes?: number;

  message?: string;
  status?: BookingStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface BookingCreateDto
  extends Omit<Booking, '_id' | 'createdAt' | 'updatedAt' | 'end'> {}
