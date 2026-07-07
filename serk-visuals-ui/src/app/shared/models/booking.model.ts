export type SessionType =
  | 'Portrait'
  | 'Family'
  | 'Wedding'
  | 'Event'
  | 'Graduation'
  | 'Real Estate'
  | 'Commercial'
  | 'Engagement'
  | 'Birthday'
  | 'Product'
  | 'Personal'
  | 'Other';

// Legacy alias kept for backward compatibility
export type BookingType = SessionType;

export type BookingStatus = 'pending' | 'new' | 'confirmed' | 'completed' | 'cancelled';

export type NumberOfPeople = '1' | '2-5' | '5-10' | '10+' | '';
export type PreferredContactMethod = 'Email' | 'Phone' | 'Text Message' | '';

export interface Booking {
  _id?: string;
  name: string;
  email: string;
  phone?: string;
  type?: SessionType;

  date?: string;           // ISO start
  end?: string;            // ISO end
  durationMinutes?: number;

  location?: string;
  numberOfPeople?: NumberOfPeople;
  preferredContactMethod?: PreferredContactMethod;
  estimatedPrice?: number;

  /** Session-type-specific fields (group size, package, services, etc.) */
  bookingDetails?: Record<string, unknown>;

  message?: string;
  status?: BookingStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface BookingCreateDto
  extends Omit<Booking, '_id' | 'createdAt' | 'updatedAt' | 'end'> {}

/** Shape returned by GET /api/bookings/slots (legacy) */
export interface SlotDay {
  date: string;       // "YYYY-MM-DD"
  slots: string[];    // ["H:MM AM/PM", ...]
}

export interface SlotsResponse {
  date: string;
  availableSlots: string[];
  nextAvailable: SlotDay | null;
}

/** Single slot entry from GET /api/bookings/availability */
export interface SlotEntry {
  startTime: string;   // "H:MM AM/PM"
  endTime:   string;   // "H:MM AM/PM"
  status: 'available' | 'taken' | 'unavailable';
}

/** Shape returned by GET /api/bookings/availability */
export interface DayAvailability {
  date: string;
  duration?: number;             // hours, echoed from request
  availableSlots: string[];      // "H:MM AM/PM"
  takenSlots: string[];
  unavailableSlots: string[];
  slots?: SlotEntry[];           // unified sorted array with startTime + endTime
  nextAvailable: { date: string; slots: string[] } | null;
}

/** Single day entry in month availability */
export interface DayStatus {
  date: string;   // "YYYY-MM-DD"
  status: 'available' | 'fully-booked' | 'unavailable';
}

/** Shape returned by GET /api/bookings/month-availability */
export interface MonthAvailability {
  month: string;   // "YYYY-MM"
  days: DayStatus[];
}
