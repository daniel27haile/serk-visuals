// shared/utils/time-ago.util.ts
export function timeAgo(input?: string | Date | null): string {
  if (!input) return '';
  const d = typeof input === 'string' ? new Date(input) : input;
  const diffMs = Date.now() - d.getTime();
  if (!isFinite(diffMs)) return '';
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `${mo}mo ago`;
  const yr = Math.floor(mo / 12);
  return `${yr}y ago`;
}
