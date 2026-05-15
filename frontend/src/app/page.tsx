import Link from "next/link";
import { CampaignCard } from "@/components/campaign-card";
import { PawBackdrop } from "@/components/paw-backdrop";
import { loadPublishedCampaigns } from "@/lib/api";

export const dynamic = "force-dynamic";

const trustPillars = [
  {
    title: "Every campaign is reviewed",
    body: "Our team reviews and verifies each fundraising campaign before it appears publicly. Nothing goes live until it clears human checks that match our standards.",
    icon: "🔍",
  },
  {
    title: "Verified people & organizations",
    body: "Individuals and organizations are personally verified by FunDogs before they can post a campaign or create an organization profile—so donors know who is behind each ask.",
    icon: "✅",
  },
  {
    title: "Zero tolerance for fraud",
    body: "We take misuse of the platform seriously. Suspected fraud is investigated, and we act on confirmed abuse—including removing campaigns and restricting accounts when needed.",
    icon: "🛡️",
  },
] as const;

export default async function HomePage() {
  const published = await loadPublishedCampaigns();
  const featured = published.slice(0, 6);

  return (
    <div>
      <section className="relative overflow-hidden border-b border-amber-900/10 bg-gradient-to-b from-amber-50 to-[#fffaf3]">
        <PawBackdrop variant="hero" />
        <div className="relative z-10 mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <p className="text-sm font-semibold uppercase tracking-widest text-teal-800">
            Welcome to FunDogs
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight text-amber-950 sm:text-5xl">
            A non-profit platform connecting rescued pets with loving homes
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-amber-950/80">
            Focused on international rescue, local rehoming, and community support—with transparent
            fundraising when you support a campaign.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Link
              href="/donate"
              className="inline-flex items-center justify-center rounded-full bg-teal-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
            >
              Donate now
            </Link>
            <Link
              href="/validation"
              className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-amber-950 ring-1 ring-amber-900/15 transition hover:bg-amber-50"
            >
              How verification works
            </Link>
            <Link
              href="/organizations"
              className="inline-flex items-center justify-center rounded-full px-2 py-3 text-sm font-semibold text-teal-800 underline-offset-4 hover:underline sm:px-4"
            >
              Explore organizations
            </Link>
          </div>
          <p className="mt-8 max-w-2xl rounded-2xl border border-teal-800/15 bg-white/70 px-4 py-3 text-sm leading-relaxed text-amber-950/85 shadow-sm backdrop-blur-sm sm:px-5">
            <span className="font-semibold text-teal-900">Peace of mind:</span> we verify organizers
            and review every campaign. See the full process on our{" "}
            <Link href="/validation" className="font-semibold text-teal-800 underline-offset-2 hover:underline">
              validation page
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="relative overflow-hidden border-y border-amber-900/10 bg-gradient-to-b from-white to-teal-50/40">
        <PawBackdrop variant="trust" />
        <div className="relative z-10 mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold text-amber-950 sm:text-3xl">
              Built on trust—not luck
            </h2>
            <p className="mt-3 text-base leading-relaxed text-amber-950/80 sm:text-lg">
              FunDogs is designed so donors and families can support animals with confidence. Here is
              how we protect the community before a single peso moves.
            </p>
          </div>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {trustPillars.map((item, index) => (
              <li
                key={item.title}
                className="flex h-full flex-col rounded-2xl border border-amber-900/10 bg-white/90 p-6 shadow-sm shadow-amber-900/5 backdrop-blur-sm"
              >
                <div className="flex items-start gap-3">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-100 text-lg"
                    aria-hidden
                  >
                    {item.icon}
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">
                      Step {index + 1}
                    </p>
                    <h3 className="mt-1 text-lg font-bold text-amber-950">{item.title}</h3>
                  </div>
                </div>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-amber-950/80">{item.body}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/validation"
              className="inline-flex items-center justify-center rounded-full bg-teal-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
            >
              Read the full verification process
            </Link>
            <Link
              href="/contact"
              className="text-sm font-semibold text-amber-950/90 underline-offset-4 hover:underline"
            >
              Report a problem
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-amber-900/10 bg-white/80">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-amber-950">Fundraising campaigns</h2>
              <p className="mt-2 max-w-xl text-sm text-amber-950/75">
                Each listing below reached our team&apos;s approval bar before publication.
              </p>
            </div>
            <Link href="/donate" className="text-sm font-semibold text-teal-800 hover:underline">
              Browse all campaigns →
            </Link>
          </div>
          {featured.length === 0 ? (
            <div className="mt-10 rounded-2xl border border-dashed border-amber-900/20 bg-amber-50/50 px-6 py-14 text-center">
              <p className="text-lg font-semibold text-amber-950">No published campaigns yet</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-amber-950/75">
                When approved campaigns go live, they will appear here. Check back soon—or learn how
                verification works before the first campaigns launch.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link
                  href="/validation"
                  className="inline-flex rounded-full bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
                >
                  How verification works
                </Link>
                <Link
                  href="/donate"
                  className="inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-amber-950 ring-1 ring-amber-900/15 hover:bg-amber-50"
                >
                  Visit the donate hub
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((c) => (
                <CampaignCard key={c.id} campaign={c} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h2 className="text-2xl font-bold text-amber-950">Our mission</h2>
        <ul className="mt-6 space-y-3 text-lg text-amber-950/85">
          <li className="flex gap-3">
            <span className="select-none text-teal-700" aria-hidden>
              ·
            </span>
            <span>Rescue cats and dogs from abuse globally.</span>
          </li>
          <li className="flex gap-3">
            <span className="select-none text-teal-700" aria-hidden>
              ·
            </span>
            <span>Bring them safely to the Philippines for rehabilitation.</span>
          </li>
          <li className="flex gap-3">
            <span className="select-none text-teal-700" aria-hidden>
              ·
            </span>
            <span>Find each animal a safe, loving forever home.</span>
          </li>
          <li className="flex gap-3">
            <span className="select-none text-teal-700" aria-hidden>
              ·
            </span>
            <span>Empower donors and rescue partners through transparency at every step.</span>
          </li>
        </ul>
      </section>

      <section className="relative overflow-hidden bg-amber-950 px-4 py-16 text-center text-amber-50 sm:px-6">
        <PawBackdrop variant="footer" />
        <div className="relative z-10">
          <h2 className="text-2xl font-bold sm:text-3xl">Thank you</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-amber-100/95">
            Together, we&apos;re making tails wag and hearts full.
          </p>
          <p className="mt-6 text-xl font-semibold">🐾 FunDogs: Rescue. Rehome. Rebuild.</p>
        </div>
      </section>
    </div>
  );
}
