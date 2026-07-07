import { DayStatus } from '../models/booking.model';

// ── Time formatting ────────────────────────────────────────────────────────

/** "10:00" → "10:00 AM" / "14:30" → "2:30 PM" */
export function formatTimeDisplay(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour   = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

/** "2:30 PM" → "14:30" */
export function parseAmPm(amPmStr: string): string {
  const parts  = amPmStr.trim().split(' ');
  const period = parts[1];
  const [hourStr, minStr] = parts[0].split(':');
  const h = parseInt(hourStr, 10);
  const m = parseInt(minStr, 10);
  const hours24 = period === 'PM' ? (h === 12 ? 12 : h + 12) : (h === 12 ? 0 : h);
  return `${String(hours24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** "10:00" + 90 mins → "11:30 AM" */
export function calculateEndTime(startHhmm: string, durationMinutes: number): string {
  const [h, m]  = startHhmm.split(':').map(Number);
  const total   = h * 60 + m + durationMinutes;
  const endH    = Math.floor(total / 60) % 24;
  const endM    = total % 60;
  return formatTimeDisplay(`${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`);
}

/** "H:MM AM/PM" + duration mins → end time display ("H:MM AM/PM") */
export function calculateEndTimeFromAmPm(amPmStr: string, durationMinutes: number): string {
  return calculateEndTime(parseAmPm(amPmStr), durationMinutes);
}

// ── Date formatting ───────────────────────────────────────────────────────

/** "2025-12-25" → "Thursday, Dec 25, 2025" */
export function formatDateDisplay(yyyymmdd: string): string {
  const [y, mo, d] = yyyymmdd.split('-').map(Number);
  return new Date(y, mo - 1, d).toLocaleDateString(undefined, {
    weekday: 'long', year: 'numeric', month: 'short', day: 'numeric',
  });
}

/** "2025-12-25" → "Tue, Dec 25" */
export function formatDateShort(yyyymmdd: string): string {
  const [y, mo, d] = yyyymmdd.split('-').map(Number);
  return new Date(y, mo - 1, d).toLocaleDateString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric',
  });
}

/** Today's date as "YYYY-MM-DD" */
export function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** "YYYY-MM-DD" + N days → "YYYY-MM-DD" */
export function addDays(yyyymmdd: string, n: number): string {
  const [y, mo, d] = yyyymmdd.split('-').map(Number);
  const date = new Date(y, mo - 1, d + n);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** year + month (0-indexed) → "YYYY-MM" */
export function getMonthString(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

// ── Calendar grid ─────────────────────────────────────────────────────────

export interface CalendarDay {
  date: string | null;
  dayNum: number | null;
  status: 'available' | 'fully-booked' | 'unavailable' | 'empty';
  isToday: boolean;
  isPast: boolean;
  isSelected: boolean;
}

/**
 * Builds a flat 7-column calendar grid for `year`/`month` (0-indexed).
 * Pads with empty cells at start and end so total length is multiple of 7.
 */
export function buildCalendarGrid(
  year: number,
  month: number,
  monthDays: DayStatus[],
  selectedDate: string | null,
  today: Date,
): CalendarDay[] {
  const firstDow  = new Date(year, month, 1).getDay();  // 0=Sun
  const daysInMo  = new Date(year, month + 1, 0).getDate();
  const todayStr  = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const statusMap = new Map(monthDays.map(d => [d.date, d.status]));
  const grid: CalendarDay[] = [];

  // Leading empty cells
  for (let i = 0; i < firstDow; i++) {
    grid.push({ date: null, dayNum: null, status: 'empty', isToday: false, isPast: false, isSelected: false });
  }

  for (let d = 1; d <= daysInMo; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isPast  = dateStr < todayStr;
    const status  = isPast ? 'unavailable' : (statusMap.get(dateStr) ?? 'unavailable');
    grid.push({
      date: dateStr,
      dayNum: d,
      status,
      isToday:    dateStr === todayStr,
      isPast,
      isSelected: dateStr === selectedDate,
    });
  }

  // Trailing cells to complete grid rows
  while (grid.length % 7 !== 0) {
    grid.push({ date: null, dayNum: null, status: 'empty', isToday: false, isPast: false, isSelected: false });
  }

  return grid;
}
