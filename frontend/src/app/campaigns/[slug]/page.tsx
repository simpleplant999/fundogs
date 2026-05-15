import { Suspense } from 'react';
import { CampaignViewSkeleton } from '@/components/page-skeletons';
import { CampaignPageClient } from './campaign-page-client';

function firstQuery(v: string | string[] | undefined): string | null {
  if (v === undefined) return null;
  if (typeof v === 'string') return v;
  if (Array.isArray(v) && typeof v[0] === 'string') return v[0];
  return null;
}

export default async function CampaignPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = searchParams ? await searchParams : {};
  const donated = firstQuery(sp.donated);
  const initialDonated =
    donated === 'stripe' || donated === 'cancel' ? (donated as 'stripe' | 'cancel') : null;
  const initialCheckoutSessionId = firstQuery(sp.session_id);
  const initialPaymentIntentId = firstQuery(sp.payment_intent);

  return (
    <Suspense fallback={<CampaignViewSkeleton />}>
      <CampaignPageClient
        slug={slug}
        initialDonated={initialDonated}
        initialCheckoutSessionId={initialCheckoutSessionId}
        initialPaymentIntentId={initialPaymentIntentId}
      />
    </Suspense>
  );
}
