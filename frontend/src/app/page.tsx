import Link from "next/link";
import { CampaignCard } from "@/components/campaign-card";
import { loadPublishedCampaigns } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const published = await loadPublishedCampaigns();
  const featured = published.slice(0, 6);

  return (
    <div>
      <section className="border-b border-amber-900/10 bg-gradient-to-b from-amber-50 to-[#fffaf3]">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <p className="text-sm font-semibold uppercase tracking-widest text-teal-800">
            Welcome to FunDogs
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight text-amber-950 sm:text-5xl">
            A non-profit platform connecting rescued pets with loving homes
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-amber-950/80">
            Focused on international rescue, local rehoming, and community support — with transparent
            fundraising when you support a campaign.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
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
              How posts are verified
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-amber-900/10 bg-white/80">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-amber-950">Fundraising campaigns</h2>
            </div>
            <Link href="/donate" className="text-sm font-semibold text-teal-800 hover:underline">
              Browse all campaigns →
            </Link>
          </div>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((c) => (
              <CampaignCard key={c.id} campaign={c} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h2 className="text-2xl font-bold text-amber-950">Our mission</h2>
        <ul className="mt-6 space-y-3 text-lg text-amber-950/85">
          <li>Rescue cats and dogs from abuse globally.</li>
          <li>Bring them safely to the Philippines for rehabilitation.</li>
          <li>Find each animal a safe, loving forever home.</li>
          <li>Empower donors and rescue partners through transparency at every step.</li>
        </ul>
      </section>

      <section className="bg-amber-950 px-4 py-16 text-center text-amber-50 sm:px-6">
        <h2 className="text-2xl font-bold sm:text-3xl">Thank you</h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-amber-100/95">
          Together, we&apos;re making tails wag and hearts full.
        </p>
        <p className="mt-6 text-xl font-semibold">🐾 FunDogs: Rescue. Rehome. Rebuild.</p>
      </section>
    </div>
  );
}
