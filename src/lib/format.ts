// Formatting is done by hand (not Intl/toLocale*) so server and client
// renders always produce identical strings.

/** The demo world is frozen on this date so seeded data stays coherent. */
export const TODAY = "2026-09-11";
export const CURRENT_PERIOD = TODAY.slice(0, 7);

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_MS = 86_400_000;

function parts(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return { y, m, d };
}

function toUtc(iso: string) {
  const { y, m, d } = parts(iso);
  return Date.UTC(y, m - 1, d);
}

export function money(n: number) {
  return "R" + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export function fmtDate(iso: string) {
  const { y, m, d } = parts(iso);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

export function fmtDay(iso: string) {
  const { m, d } = parts(iso);
  return `${d} ${MONTHS[m - 1]}`;
}

export function fmtLongDate(iso: string) {
  const { y, m, d } = parts(iso);
  return `${WEEKDAYS[new Date(toUtc(iso)).getUTCDay()]}, ${d} ${MONTHS_LONG[m - 1]} ${y}`;
}

export function fmtPeriod(period: string) {
  const [y, m] = period.split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

export function fmtTime(iso: string) {
  return iso.length >= 16 ? iso.slice(11, 16) : "";
}

export function addDays(iso: string, days: number) {
  return new Date(toUtc(iso) + days * DAY_MS).toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string) {
  return Math.round((toUtc(to) - toUtc(from)) / DAY_MS);
}

export function fmtAgo(iso: string) {
  const n = daysBetween(iso, TODAY);
  if (n <= 0) return "Today";
  if (n === 1) return "Yesterday";
  if (n < 7) return `${n} days ago`;
  return fmtDay(iso);
}

/** Current wall-clock time, pinned to the demo date. */
export function demoNow() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${TODAY}T${p(d.getHours())}:${p(d.getMinutes())}:00`;
}

export function sum<T>(items: T[], fn: (item: T) => number) {
  return items.reduce((total, item) => total + fn(item), 0);
}

export function pct(ratio: number) {
  return `${Math.round(ratio * 100)}%`;
}
