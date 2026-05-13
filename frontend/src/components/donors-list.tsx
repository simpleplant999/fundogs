import type { Donor } from "@/lib/types";
import { formatPhp } from "@/lib/format-currency";

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/**
 * MMM dd, YYYY HH:MM (24h, local timezone).
 * Date-only strings (YYYY-MM-DD) must not use `new Date(iso)` — that is UTC midnight and
 * shows as 08:00 in UTC+8. Parse as a local calendar day instead.
 */
function formatDonorDate(iso: string): string {
  const s = iso.trim();
  let d: Date;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, mo, da] = s.split("-").map(Number);
    d = new Date(y, mo - 1, da, 0, 0, 0, 0);
  } else {
    d = new Date(s);
  }
  if (Number.isNaN(d.getTime())) return iso;
  const mmm = MONTH_SHORT[d.getMonth()];
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${mmm} ${dd}, ${yyyy} ${hh}:${mm}`;
}

export function DonorsList({ donors }: { donors: Donor[] }) {
  if (!donors.length) {
    return (
      <p className="rounded-xl border border-dashed border-amber-900/15 bg-amber-50/50 px-4 py-6 text-sm text-amber-950/70">
        No public donor entries yet.
      </p>
    );
  }
  return (
    <ul className="divide-y divide-amber-900/10 rounded-xl border border-amber-900/10 bg-white">
      {donors.map((d) => (
        <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
          <div>
            <p className="font-medium text-amber-950">{d.name}</p>
            <p className="text-xs text-amber-950/60">{formatDonorDate(d.date)}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-teal-800">{formatPhp(d.amount)}</span>
            {d.verification === "verified" ? (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                Verified
              </span>
            ) : d.verification === "rejected" ? (
              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-900">
                Rejected
              </span>
            ) : (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
                Pending review
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
