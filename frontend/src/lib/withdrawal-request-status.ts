const BASE = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset';

const STATUS_PILL_CLASS: Record<string, string> = {
  REQUESTED: `${BASE} bg-amber-100 text-amber-900 ring-amber-600/20`,
  APPROVED: `${BASE} bg-sky-100 text-sky-900 ring-sky-600/20`,
  PAID: `${BASE} bg-emerald-100 text-emerald-900 ring-emerald-600/20`,
  REJECTED: `${BASE} bg-rose-100 text-rose-900 ring-rose-600/20`,
};

export function withdrawalStatusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

export function withdrawalStatusPillClass(status: string): string {
  return STATUS_PILL_CLASS[status.toUpperCase()] ?? `${BASE} bg-zinc-100 text-zinc-700 ring-zinc-500/20`;
}
