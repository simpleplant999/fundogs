import { Suspense } from 'react';
import { CampaignPageClient } from './campaign-page-client';

export default async function CampaignPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-16 text-center text-amber-950/80 sm:px-6">Loading campaign…</div>
      }
    >
      <CampaignPageClient slug={slug} />
    </Suspense>
  );
}
