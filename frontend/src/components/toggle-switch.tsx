'use client';

type ToggleSwitchProps = {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  disabled?: boolean;
  description?: string;
};

export function ToggleSwitch({
  id,
  label,
  checked,
  onCheckedChange,
  disabled = false,
  description,
}: ToggleSwitchProps) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <label htmlFor={id} className="text-sm font-medium text-amber-950">
          {label}
        </label>
        {description ? <p className="mt-0.5 text-xs text-amber-950/65">{description}</p> : null}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/40 disabled:cursor-not-allowed disabled:opacity-60 ${
          checked ? 'bg-teal-700' : 'bg-amber-900/15'
        }`}
      >
        <span className="sr-only">{label}</span>
        <span
          aria-hidden
          className={`pointer-events-none absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
