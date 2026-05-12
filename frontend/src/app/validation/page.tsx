import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How verification works",
};

export default function ValidationPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-amber-950">Post validation process</h1>
      <p className="mt-3 text-lg text-amber-950/85">
        We take time to get this right. FunDogs combines human review (including video calls and other checks)
        with clear status updates you can follow in your profile and on each listing.
      </p>
      <ol className="mt-10 space-y-6">
        <li className="flex gap-4 rounded-2xl border border-amber-900/10 bg-white p-5 shadow-sm">
          <span className="text-2xl" aria-hidden>
            🧪
          </span>
          <div>
            <p className="font-semibold text-amber-950">Human review</p>
            <p className="mt-1 text-sm leading-relaxed text-amber-950/80">
              Posts are reviewed via video call and complementary verification methods appropriate to the case.
            </p>
          </div>
        </li>
        <li className="flex gap-4 rounded-2xl border border-amber-900/10 bg-white p-5 shadow-sm">
          <span className="text-2xl" aria-hidden>
            ⏳
          </span>
          <div>
            <p className="font-semibold text-amber-950">Up to five days</p>
            <p className="mt-1 text-sm leading-relaxed text-amber-950/80">
              Validation can take up to five business days depending on queue depth and evidence quality.
            </p>
          </div>
        </li>
        <li className="flex gap-4 rounded-2xl border border-amber-900/10 bg-white p-5 shadow-sm">
          <span className="text-2xl" aria-hidden>
            ✅
          </span>
          <div>
            <p className="font-semibold text-amber-950">Go live when approved</p>
            <p className="mt-1 text-sm leading-relaxed text-amber-950/80">
              Approved posts publish automatically to the public surfaces you expect (for example,
              campaigns and other listings you enable later).
            </p>
          </div>
        </li>
        <li className="flex gap-4 rounded-2xl border border-amber-900/10 bg-white p-5 shadow-sm">
          <span className="text-2xl" aria-hidden>
            👀
          </span>
          <div>
            <p className="font-semibold text-amber-950">Transparent statuses</p>
            <p className="mt-1 text-sm leading-relaxed text-amber-950/80">
              Submitted → In review → Approved / Needs info — always visible so donors and families stay
              aligned.
            </p>
          </div>
        </li>
      </ol>
    </div>
  );
}
