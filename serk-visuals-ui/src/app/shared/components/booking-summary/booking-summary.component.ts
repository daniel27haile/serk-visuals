import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionType } from '../../models/booking.model';
import {
  calculateEndTimeFromAmPm,
  formatDateDisplay,
  formatDateShort,
} from '../../utils/availability.utils';

@Component({
  selector: 'app-booking-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './booking-summary.component.html',
  styleUrls: ['./booking-summary.component.scss'],
})
export class BookingSummaryComponent {
  /** Session type selected on the booking form. */
  @Input() sessionType: SessionType | null = null;
  /** Duration in minutes (driven by modal selection). */
  @Input() durationMinutes: number = 60;
  /** YYYY-MM-DD string of the selected date. */
  @Input() selectedDate: string | null = null;
  /** Start time as "H:MM AM/PM" from the modal. */
  @Input() startTime: string | null = null;
  /** Pre-computed estimated price. */
  @Input() estimatedPrice: number | null = null;
  /** Optional prefix label for the price display (e.g. "Starting at"). */
  @Input() pricingLabel: string = '';
  /** Formatted detail entries computed by the parent (e.g. group size, package). */
  @Input() summaryDetails: { label: string; value: string }[] = [];
  /**
   * compact = condensed card inside the booking form.
   * full    = detailed panel inside the scheduling modal.
   */
  @Input() compact = false;

  get endTime(): string | null {
    return this.startTime
      ? calculateEndTimeFromAmPm(this.startTime, this.durationMinutes)
      : null;
  }

  get dateDisplay(): string {
    if (!this.selectedDate) return '';
    return this.compact
      ? formatDateDisplay(this.selectedDate)
      : formatDateDisplay(this.selectedDate);
  }

  get dateShort(): string {
    return this.selectedDate ? formatDateShort(this.selectedDate) : '';
  }

  get durationLabel(): string {
    const h = this.durationMinutes / 60;
    return h === 1 ? '1 hour' : `${h} hours`;
  }

  get sessionLabel(): string {
    return this.sessionType ? `${this.sessionType} Session` : '';
  }

  get hasSchedule(): boolean {
    return !!this.selectedDate && !!this.startTime;
  }
}
