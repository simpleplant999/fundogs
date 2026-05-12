import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-amber-950">Terms &amp; conditions (summary)</h1>
      <p className="mt-3 text-amber-950/80">
        High-level fee rules from your deck — replace with counsel-reviewed legal text before production.
      </p>
      <ul className="mt-10 space-y-6 text-amber-950/90">
        <li className="flex gap-3 rounded-2xl border border-amber-900/10 bg-white p-5 shadow-sm">
          <span className="text-2xl" aria-hidden>
            💸
          </span>
          <div>
            <p className="font-semibold text-amber-950">2% platform fee per fundraising</p>
            <p className="mt-1 text-sm leading-relaxed text-amber-950/80">
              Charged upon withdrawal so campaigns keep more of what donors intend during the drive.
            </p>
          </div>
        </li>
        <li className="flex gap-3 rounded-2xl border border-amber-900/10 bg-white p-5 shadow-sm">
          <span className="text-2xl" aria-hidden>
            💳
          </span>
          <div>
            <p className="font-semibold text-amber-950">1% processing fee for donors</p>
            <p className="mt-1 text-sm leading-relaxed text-amber-950/80">
              Helps cover payment rails where card or wallet checkout is available (manual bank flows follow
              moderator verification instead).
            </p>
          </div>
        </li>
        <li className="flex gap-3 rounded-2xl border border-amber-900/10 bg-white p-5 shadow-sm">
          <span className="text-2xl" aria-hidden>
            🏁
          </span>
          <div>
            <p className="font-semibold text-amber-950">Withdrawal milestone</p>
            <p className="mt-1 text-sm leading-relaxed text-amber-950/80">
              Withdrawal unlocks at the <strong>50% funding</strong> milestone. If the campaign does not reach
              50% within the stated timeframe (see full legal copy), additional rules apply — communicate the
              exact window clearly on each campaign.
            </p>
            <p className="mt-2 text-sm italic text-amber-950/70">
              Tagline from deck: &quot;Pag di umabot ng 50% / Days&quot; — pair percentage and calendar rules in
              your final policy.
            </p>
          </div>
        </li>
      </ul>
    </div>
  );
}
