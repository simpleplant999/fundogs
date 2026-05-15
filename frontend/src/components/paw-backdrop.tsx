/**
 * Sparse decorative paw prints (2–3 per section), not a full tile pattern.
 */
function PawShape({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      fill="currentColor"
      role="presentation"
    >
      <ellipse cx="32" cy="46" rx="15" ry="12" />
      <circle cx="17" cy="28" r="9" />
      <circle cx="32" cy="21" r="9" />
      <circle cx="47" cy="28" r="9" />
      <circle cx="11" cy="40" r="7.5" />
    </svg>
  );
}

const heroPaws = [
  "absolute right-0 top-2 h-52 w-52 translate-x-[18%] text-teal-800/18 rotate-[14deg] sm:h-64 sm:w-64 sm:translate-x-[12%] md:h-72 md:w-72",
  "absolute -left-10 bottom-6 h-44 w-44 text-teal-800/14 -rotate-[18deg] sm:-left-6 sm:bottom-10 sm:h-52 sm:w-52",
  "absolute right-[8%] bottom-[12%] hidden h-36 w-36 text-teal-800/10 -rotate-[22deg] md:block lg:h-44 lg:w-44",
] as const;

const trustPaws = [
  "absolute -left-14 top-[18%] h-56 w-56 text-teal-800/12 rotate-[12deg] sm:-left-8 sm:h-64 sm:w-64",
  "absolute -right-10 bottom-12 h-48 w-48 text-teal-800/12 -rotate-[10deg] sm:-right-4 sm:bottom-16 sm:h-56 sm:w-56",
] as const;

const footerPaws = [
  "absolute left-2 top-1/2 h-44 w-44 -translate-y-1/2 text-amber-200/22 rotate-[16deg] sm:left-8 sm:h-52 sm:w-52",
  "absolute right-4 bottom-8 h-36 w-36 text-amber-200/18 -rotate-[12deg] sm:right-12 sm:bottom-10 sm:h-44 sm:w-44",
] as const;

export function PawBackdrop({
  variant,
  className,
}: {
  variant: "hero" | "trust" | "footer";
  className?: string;
}) {
  const paws = variant === "hero" ? heroPaws : variant === "trust" ? trustPaws : footerPaws;

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ""}`}
      aria-hidden
    >
      {paws.map((positionClass, i) => (
        <PawShape key={`${variant}-${i}`} className={positionClass} />
      ))}
    </div>
  );
}
