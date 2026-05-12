/** Digits only (integer goal amounts). */
export function digitsFromGoalInput(s: string): string {
  return s.replace(/\D/g, '');
}

/** Thousands separators for display while typing or after load. */
export function formatGoalAmountDisplay(raw: string): string {
  const d = digitsFromGoalInput(raw);
  if (!d) return '';
  const n = Number(d);
  if (!Number.isFinite(n)) return '';
  return n.toLocaleString('en-US');
}

export function formatGoalAmountFromNumber(n: number): string {
  if (!Number.isFinite(n)) return '';
  return Math.round(n).toLocaleString('en-US');
}

export function parseGoalAmountInput(display: string): number {
  const d = digitsFromGoalInput(display);
  if (!d) return NaN;
  return Number(d);
}
