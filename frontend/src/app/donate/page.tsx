import type { Metadata } from "next";
import { CampaignCard } from "@/components/campaign-card";
import { loadPublishedCampaigns } from "@/lib/api";

export const metadata: Metadata = {
  title: "Donate Now",
};

export const dynamic = "force-dynamic";

export default async function DonatePage() {
  const list = await loadPublishedCampaigns();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-amber-950">Donate now</h1>
        <p className="mt-3 text-amber-950/80">
          Pick a campaign to see the full story and donor wall.
        </p>
      </header>
      <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((c) => (
          <CampaignCard key={c.id} campaign={c} />
        ))}
      </div>
    </div>
  );
}
