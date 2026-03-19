import {
  ChangeDetectorRef,
  inject,
  OnDestroy,
  Pipe,
  PipeTransform,
} from '@angular/core';

/**
 * Converts an epoch-ms timestamp to a human-readable relative label.
 * Exported separately so it can be unit-tested without the pipe wrapper.
 */
export function relativeTime(epochMs: number): string {
  const diff = Date.now() - epochMs;
  if (diff < 60_000)  return 'now';
  const m = Math.floor(diff / 60_000);
  if (m < 60)         return `${m}m ago`;
  const h = Math.floor(diff / 3_600_000);
  if (h < 24)         return `${h}h ago`;
  const d = Math.floor(diff / 86_400_000);
  if (d < 30)         return `${d}d ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12)        return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}

/**
 * Impure pipe that displays a live relative-time label (e.g. "3m ago", "2h ago").
 * Each instance sets up one 60-second interval to trigger change detection,
 * keeping the label fresh without a page reload. The interval is cleared on destroy.
 */
@Pipe({ name: 'timeAgo', standalone: true, pure: false })
export class TimeAgoPipe implements OnDestroy, PipeTransform {
  private cdRef = inject(ChangeDetectorRef);
  private timer: ReturnType<typeof setInterval> | null = null;

  transform(value: string | Date | undefined | null): string {
    if (!value) return '';
    const t = new Date(value).getTime();
    if (!Number.isFinite(t)) return '';

    if (!this.timer) {
      this.timer = setInterval(() => this.cdRef.markForCheck(), 60_000);
    }

    return relativeTime(t);
  }

  ngOnDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
