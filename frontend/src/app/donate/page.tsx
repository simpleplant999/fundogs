import type { Metadata } from "next";
import { CampaignTypeFilterChips } from "@/components/campaign-type-filter-chips";
import { CampaignCard } from "@/components/campaign-card";
import { isCampaignTypeId } from "@/lib/campaign-type";
import { loadPublishedCampaigns } from "@/lib/api";
import type { CampaignTypeId } from "@/lib/types";

export const metadata: Metadata = {
  title: "Donate Now",
};

export const dynamic = "force-dynamic";

export default async function DonatePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type: typeRaw } = await searchParams;
  const typeFilter: CampaignTypeId | undefined =
    typeRaw && isCampaignTypeId(typeRaw) ? typeRaw : undefined;
  const list = await loadPublishedCampaigns(typeFilter);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-amber-950">Donate now</h1>
        <p className="mt-3 text-amber-950/80">
          Pick a campaign to see the full story and donor wall.
        </p>
      </header>
      <div className="mt-8">
        <CampaignTypeFilterChips selected={typeFilter} />
      </div>
      <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((c) => (
          <CampaignCard key={c.id} campaign={c} />
        ))}
      </div>
      {!list.length ? (
        <p className="mt-10 text-center text-sm text-amber-950/70">
          No campaigns match this type right now. Try another filter or check back soon.
        </p>
      ) : null}
    </div>
  );
}
