type Props = {
  className?: string;
  /** Tighter padding for small card overlays */
  compact?: boolean;
};

export function OrganizationVerifiedBadge({ className = '', compact }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full bg-teal-700 font-semibold uppercase tracking-wide text-white shadow-sm ring-1 ring-teal-900/10 ${
        compact ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-1 text-[10px] sm:text-xs'
      } ${className}`}
      title="Verified organization on FunDogs"
    >
      <svg
        className={compact ? 'h-2.5 w-2.5 shrink-0' : 'h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5'}
        viewBox="0 0 16 16"
        fill="currentColor"
        aria-hidden
      >
        <path
          fillRule="evenodd"
          d="M8 16A8 8 0 108 0a8 8 0 000 16zm3.78-9.52a.75.75 0 00-1.06-1.06L7.25 9.19 5.28 7.22a.75.75 0 10-1.06 1.06l2.5 2.5c.29.29.76.29 1.06 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
      Verified
    </span>
  );
}
