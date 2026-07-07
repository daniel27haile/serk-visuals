import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { BookingsService } from '../../services/booking.service';
import { DayAvailability, DayStatus, SessionType, SlotDay } from '../../models/booking.model';
import {
  CalendarDay,
  buildCalendarGrid,
  calculateEndTimeFromAmPm,
  formatDateDisplay,
  formatDateShort,
  getMonthString,
  parseAmPm,
} from '../../utils/availability.utils';
import { calcEstimatedPrice } from '../../utils/pricing.utils';

export interface SelectedSlot {
  date: string;           // "YYYY-MM-DD"
  time: string;           // "HH:MM" (24-hour for the backend)
  timeDisplay: string;    // "H:MM AM/PM" (for display)
  durationMinutes: number;
}

// Fallback slots shown when the API is unreachable
const FALLBACK_SLOTS: Pick<DayAvailability, 'availableSlots' | 'takenSlots' | 'unavailableSlots' | 'nextAvailable'> = {
  availableSlots:   ['10:00 AM', '11:00 AM', '12:00 PM', '2:00 PM', '3:30 PM', '4:30 PM'],
  takenSlots:       ['1:00 PM'],
  unavailableSlots: ['5:30 PM', '6:00 PM'],
  nextAvailable:    null,
};

@Component({
  selector: 'app-availability-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './availability-modal.component.html',
  styleUrls: ['./availability-modal.component.scss'],
})
export class AvailabilityModalComponent implements OnChanges, OnDestroy {
  @Input() open = false;
  @Input() durationMinutes = 60;
  /** Session type from the booking form — used to compute estimated price. */
  @Input() sessionType: SessionType | null = null;
  @Output() closed       = new EventEmitter<void>();
  @Output() slotSelected = new EventEmitter<SelectedSlot>();

  private bookings = inject(BookingsService);

  // ── Duration options ─────────────────────────────────────
  readonly durationOptions = [
    { label: '30 minutes', value: 30  },
    { label: '1 hour',     value: 60  },
    { label: '2 hours',    value: 120 },
    { label: '3 hours',    value: 180 },
    { label: '4 hours',    value: 240 },
    { label: '5 hours',    value: 300 },
    { label: '6 hours',    value: 360 },
    { label: '7 hours',    value: 420 },
    { label: '8 hours',    value: 480 },
  ];

  readonly DOW_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  readonly MONTH_NAMES = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
  ];

  // ── Calendar state ───────────────────────────────────────
  calYear      = signal(new Date().getFullYear());
  calMonth     = signal(new Date().getMonth()); // 0-indexed
  monthData    = signal<DayStatus[]>([]);
  loadingMonth = signal(false);

  // ── Day slots state ──────────────────────────────────────
  selectedDate = signal<string | null>(null);
  dayAvail     = signal<DayAvailability | null>(null);
  loadingDay   = signal(false);

  // ── Selection state ──────────────────────────────────────
  selectedTime     = signal<string | null>(null);     // "H:MM AM/PM"
  selectedDuration = signal<number | null>(null);     // null = no selection yet

  // ── Validation ───────────────────────────────────────────
  validationError = signal<string | null>(null);

  // ── Next-available state (for fully-booked days) ─────────
  nextAvailDays = signal<SlotDay[]>([]);
  loadingNext   = signal(false);

  // ── API fallback flag ────────────────────────────────────
  apiFallback = signal(false);

  // ── Derived ──────────────────────────────────────────────

  hasDuration = computed(() => this.selectedDuration() !== null);

  /** All three required: date + duration + time */
  hasSelection = computed(() =>
    !!this.selectedDate() && this.hasDuration() && !!this.selectedTime()
  );

  /** Price is only shown once the full schedule is selected.
   *  Returns null for dynamic-priced types (Real Estate, Product) because
   *  their price depends on form fields outside the modal — the booking form's
   *  breakdown card shows the correct live total instead. */
  estimatedPrice = computed(() => {
    if (!this.hasSelection()) return null;
    if (this.sessionType === 'Real Estate' || this.sessionType === 'Product') return null;
    return calcEstimatedPrice(this.sessionType, this.selectedDuration()!);
  });

  calendarGrid = computed<CalendarDay[]>(() => {
    try {
      return buildCalendarGrid(
        this.calYear(), this.calMonth(),
        this.monthData(), this.selectedDate(),
        new Date(),
      );
    } catch (e) {
      console.error('[modal] calendarGrid error:', e);
      return [];
    }
  });

  allSlots = computed<string[]>(() => {
    const a = this.dayAvail();
    if (!a) return [];
    const set = new Set([...a.availableSlots, ...a.takenSlots, ...a.unavailableSlots]);
    return [...set].sort((x, y) => this.toMinutes(x) - this.toMinutes(y));
  });

  get monthLabel(): string {
    return `${this.MONTH_NAMES[this.calMonth()]} ${this.calYear()}`;
  }

  // ── Lifecycle ────────────────────────────────────────────
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open']?.currentValue === true) {
      // Always start fresh — no preselected duration
      this.selectedDuration.set(null);
      this.validationError.set(null);
      this.loadMonth(this.calYear(), this.calMonth());
      // Don't load day slots — user must select duration first
    }
  }

  ngOnDestroy(): void {}

  // ── Month navigation ─────────────────────────────────────
  prevMonth(): void {
    let m = this.calMonth() - 1, y = this.calYear();
    if (m < 0) { m = 11; y--; }
    this.calMonth.set(m); this.calYear.set(y);
    this.loadMonth(y, m);
  }

  nextMonth(): void {
    let m = this.calMonth() + 1, y = this.calYear();
    if (m > 11) { m = 0; y++; }
    this.calMonth.set(m); this.calYear.set(y);
    this.loadMonth(y, m);
  }

  // ── Data loading ─────────────────────────────────────────
  private loadMonth(year: number, month: number): void {
    this.loadingMonth.set(true);
    const monthStr = getMonthString(year, month);
    // Fall back to 1-hour for month loading when no duration is selected yet
    const hours = (this.selectedDuration() ?? 60) / 60;

    this.bookings.getMonthAvailability(monthStr, hours).subscribe({
      next: res => {
        this.monthData.set(res.days);
        this.loadingMonth.set(false);
        this.apiFallback.set(false);
      },
      error: err => {
        console.warn('[modal] month API failed — using fallback:', err?.message ?? err);
        this.monthData.set(this.buildFallbackMonthDays(year, month));
        this.loadingMonth.set(false);
        this.apiFallback.set(true);
      },
    });
  }

  private loadDay(dateStr: string): void {
    const duration = this.selectedDuration();
    if (duration === null) return; // Cannot load without duration

    this.loadingDay.set(true);
    this.dayAvail.set(null);
    this.selectedTime.set(null);
    this.nextAvailDays.set([]);
    const hours = duration / 60;

    this.bookings.getDayAvailability(dateStr, hours).subscribe({
      next: res => {
        this.dayAvail.set(res);
        this.loadingDay.set(false);
        this.apiFallback.set(false);
        if (!res.availableSlots.length) this.loadNextAvail();
      },
      error: err => {
        console.warn('[modal] day API failed — using fallback slots:', err?.message ?? err);
        this.dayAvail.set({ date: dateStr, ...FALLBACK_SLOTS });
        this.loadingDay.set(false);
        this.apiFallback.set(true);
      },
    });
  }

  private loadNextAvail(): void {
    this.loadingNext.set(true);
    const hours = (this.selectedDuration() ?? 60) / 60;
    this.bookings.getNextAvailability(hours, 5).subscribe({
      next:  days => { this.nextAvailDays.set(days); this.loadingNext.set(false); },
      error: ()   => { this.nextAvailDays.set([]);   this.loadingNext.set(false); },
    });
  }

  // ── Interactions ─────────────────────────────────────────
  selectDay(day: CalendarDay): void {
    if (!day.date || day.isPast) return;
    if (new Date(day.date + 'T12:00:00').getDay() === 0) return;

    this.selectedDate.set(day.date);
    this.selectedTime.set(null);
    this.nextAvailDays.set([]);
    this.dayAvail.set(null);
    this.validationError.set(null);

    const [y, m] = day.date.split('-').map(Number);
    if (y !== this.calYear() || (m - 1) !== this.calMonth()) {
      this.calYear.set(y); this.calMonth.set(m - 1);
      this.loadMonth(y, m - 1);
    }

    // Only load time slots if duration is already selected
    if (this.hasDuration()) {
      this.loadDay(day.date);
    }
  }

  selectTime(time: string): void {
    const avail = this.dayAvail();
    if (!avail?.availableSlots.includes(time)) return;
    this.selectedTime.set(time);
    this.validationError.set(null);
  }

  onDurationChange(raw: unknown): void {
    if (raw === '' || raw === null || raw === undefined) {
      this.selectedDuration.set(null);
      this.dayAvail.set(null);
      return;
    }
    const mins = Number(raw);
    if (isNaN(mins) || mins <= 0) return;

    this.selectedDuration.set(mins);
    this.selectedTime.set(null);
    this.validationError.set(null);
    this.loadMonth(this.calYear(), this.calMonth());
    if (this.selectedDate()) this.loadDay(this.selectedDate()!);
  }

  jumpToDate(dateStr: string): void {
    const [y, m] = dateStr.split('-').map(Number);
    this.calYear.set(y); this.calMonth.set(m - 1);
    this.selectedDate.set(dateStr);
    this.selectedTime.set(null);
    this.nextAvailDays.set([]);
    this.loadMonth(y, m - 1);
    this.loadDay(dateStr);
  }

  jumpToNextAvailable(): void {
    const days = this.nextAvailDays();
    if (days.length) this.jumpToDate(days[0].date);
  }

  confirm(): void {
    if (!this.hasDuration()) {
      this.validationError.set('Please select a session duration.');
      return;
    }
    if (!this.selectedTime()) {
      this.validationError.set('Please select an available time slot.');
      return;
    }
    const date = this.selectedDate();
    const time = this.selectedTime();
    if (!date || !time) return;

    this.slotSelected.emit({
      date,
      time:            parseAmPm(time),
      timeDisplay:     time,
      durationMinutes: this.selectedDuration()!,
    });
    this.closed.emit();
  }

  close(): void { this.closed.emit(); }

  // ── Template helpers ─────────────────────────────────────
  formatDateDisplay        = formatDateDisplay;
  formatDateShort          = formatDateShort;
  calculateEndTimeFromAmPm = calculateEndTimeFromAmPm;

  slotClass(time: string): string {
    if (this.selectedTime() === time)    return 'slot--selected';
    const a = this.dayAvail();
    if (!a)                              return 'slot--unavailable';
    if (a.availableSlots.includes(time)) return 'slot--available';
    if (a.takenSlots.includes(time))     return 'slot--taken';
    return 'slot--unavailable';
  }

  isDisabled(time: string): boolean {
    return !this.dayAvail()?.availableSlots.includes(time);
  }

  isSunday(day: CalendarDay): boolean {
    return !!day.date && new Date(day.date + 'T12:00:00').getDay() === 0;
  }

  durationLabel(mins: number): string {
    if (mins < 60) return `${mins} minutes`;
    if (mins === 60) return '1 hour';
    return `${mins / 60} hours`;
  }

  private toMinutes(amPmStr: string): number {
    const parts  = amPmStr.trim().split(' ');
    const period = parts[1] ?? 'AM';
    const [hStr, mStr] = (parts[0] ?? '12:00').split(':');
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    const h24 = period === 'PM' ? (h === 12 ? 12 : h + 12) : (h === 12 ? 0 : h);
    return h24 * 60 + m;
  }

  // ── Fallback data generators ─────────────────────────────
  private buildFallbackMonthDays(year: number, month: number): DayStatus[] {
    const today   = new Date();
    const todayY  = today.getFullYear();
    const todayM  = today.getMonth();
    const todayD  = today.getDate();
    const daysInMo = new Date(year, month + 1, 0).getDate();
    const result: DayStatus[] = [];

    for (let d = 1; d <= daysInMo; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dow     = new Date(year, month, d).getDay();
      const isPast  = (
        year < todayY ||
        (year === todayY && month < todayM) ||
        (year === todayY && month === todayM && d < todayD)
      );
      result.push({
        date:   dateStr,
        status: (isPast || dow === 0) ? 'unavailable' : 'available',
      });
    }
    return result;
  }
}
