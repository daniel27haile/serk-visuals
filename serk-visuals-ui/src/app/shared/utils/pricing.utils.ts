import { SessionType } from '../models/booking.model';

/**
 * Per-hour base rates by session type (USD).
 * Update here to affect all pricing displays.
 */
export const PRICE_MAP: Record<SessionType, number> = {
  Portrait:      150,
  Family:        200,
  Wedding:       400,
  Event:         200,
  Graduation:    150,
  'Real Estate': 250,
  Commercial:    300,
  Engagement:    200,
  Birthday:      175,
  Product:       275,
  Personal:      150,
  Other:         175,
};

/** Calculates the estimated session price from type and duration. */
export function calcEstimatedPrice(
  type: SessionType | null | undefined,
  durationMinutes: number,
): number {
  const rate = (type && PRICE_MAP[type]) ?? 175;
  return Math.round(rate * (durationMinutes / 60));
}
