/**
 * Formats a booking ISO date string into a human-readable local date/time.
 * Shared between the user-side booking confirmation and the admin-side Gmail draft.
 * Matches the format originally used in booking.component.ts (toLocalReadable).
 */
export function formatBookingDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
