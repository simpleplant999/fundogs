export function ProgressBar({
  raised,
  goal,
}: {
  raised: number;
  goal: number;
}) {
  const pct = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;
  return (
    <div className="space-y-1">
      <div className="h-2.5 overflow-hidden rounded-full bg-amber-900/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-teal-600 to-teal-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs font-medium text-amber-950/70">{pct}% of goal</p>
    </div>
  );
}
