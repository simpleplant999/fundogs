'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CampaignImageCarousel } from '@/components/campaign-image-carousel';
import { CampaignShareMenu } from '@/components/campaign-share-menu';
import { CampaignStripeDonate } from '@/components/campaign-stripe-donate';
import { DonorsList } from '@/components/donors-list';
import { ProgressBar } from '@/components/progress-bar';
import { getCampaignImages } from '@/lib/campaign-images';
import { getClientApiBase, useAuth } from '@/providers/auth-provider';
import type { Campaign, Donor } from '@/lib/types';

function formatPhp(n: number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(n);
}

function canStripeDonate(c: Campaign): boolean {
  return (
    c.approvalStatus === 'approved' && (c.status === 'Published' || c.status === 'Done')
  );
}

function StatusLine({ status }: { status: Campaign['status'] }) {
  const copy: Record<Campaign['status'], string> = {
    Published: 'Live — accepting donations.',
    Draft: 'Draft — visible to you and moderators until approved.',
    Archived: 'Archived — historical record; donations are closed.',
    Done: 'Done — goal reached; thank you to everyone who gave.',
  };
  return <p className="text-sm font-medium text-amber-950/80">{copy[status]}</p>;
}

export function CampaignPageClient({ slug }: { slug: string }) {
  const { token } = useAuth();
  const api = getClientApiBase();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [donateBanner, setDonateBanner] = useState<string | null>(null);
  const donateHandled = useRef<string | null>(null);

  type LoadSnapshot =
    | { ok: false; status?: number }
    | { ok: true; raised: number; donorCount: number };

  /** Fetches campaign + donors and updates state; does not touch `loading` or `error`. */
  const silentRefreshCampaign = useCallback(async (): Promise<LoadSnapshot> => {
    if (!api) return { ok: false };
    const headers: HeadersInit = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    try {
      const [cRes, dRes] = await Promise.all([
        fetch(`${api}/campaigns/${encodeURIComponent(slug)}`, { headers }),
        fetch(`${api}/campaigns/${encodeURIComponent(slug)}/donors`, { headers }),
      ]);
      if (!cRes.ok) return { ok: false, status: cRes.status };
      const c = (await cRes.json()) as Campaign;
      const donorList = dRes.ok ? ((await dRes.json()) as Donor[]) : [];
      setCampaign(c);
      setDonors(donorList);
      return { ok: true, raised: c.raisedAmount, donorCount: donorList.length };
    } catch {
      return { ok: false };
    }
  }, [api, slug, token]);

  const load = useCallback(async (): Promise<LoadSnapshot> => {
    if (!api) {
      setError('NEXT_PUBLIC_API_URL is not set');
      setLoading(false);
      return { ok: false };
    }
    setLoading(true);
    setError(null);
    try {
      const snap = await silentRefreshCampaign();
      if (!snap.ok) {
        setCampaign(null);
        setDonors([]);
        setError(snap.status === 404 ? 'Campaign not found.' : 'Could not load campaign.');
        return { ok: false };
      }
      return snap;
    } catch {
      setError('Network error.');
      setCampaign(null);
      setDonors([]);
      return { ok: false };
    } finally {
      setLoading(false);
    }
  }, [api, silentRefreshCampaign]);

  /** Webhooks can lag behind Stripe client success; poll until DB reflects the gift. */
  const pollUntilDonationRecorded = useCallback(
    async (raisedBefore: number, donorCountBefore: number) => {
      if (!api) return;
      const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
      const maxAttempts = 22;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        if (attempt > 0) await wait(650);
        const snap = await silentRefreshCampaign();
        if (
          snap.ok &&
          (snap.raised > raisedBefore || snap.donorCount > donorCountBefore)
        ) {
          return;
        }
      }
    },
    [api, silentRefreshCampaign],
  );

  const campaignRef = useRef<Campaign | null>(null);
  const donorsRef = useRef<Donor[]>([]);
  useEffect(() => {
    campaignRef.current = campaign;
    donorsRef.current = donors;
  }, [campaign, donors]);

  const onDonateSuccess = useCallback(
    (info?: { amountAddedPhp: number }) => {
      const c = campaignRef.current;
      if (!c) return;
      const raisedBefore = c.raisedAmount;
      const countBefore = donorsRef.current.length;
      const add = info?.amountAddedPhp;
      if (add != null && Number.isFinite(add) && add > 0) {
        setCampaign((cur) => (cur ? { ...cur, raisedAmount: cur.raisedAmount + add } : null));
      }
      void pollUntilDonationRecorded(raisedBefore, countBefore);
      setDonateBanner('Thanks! Your gift was successful.');
    },
    [pollUntilDonationRecorded],
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const d = searchParams.get('donated');
    if (d !== 'stripe' && d !== 'cancel') {
      donateHandled.current = null;
      return;
    }
    const key = `${slug}:${d}:${searchParams.get('session_id') ?? ''}`;
    if (donateHandled.current === key) return;
    donateHandled.current = key;
    void (async () => {
      const snapshot = await silentRefreshCampaign();
      if (d === 'stripe' && snapshot.ok) {
        await pollUntilDonationRecorded(snapshot.raised, snapshot.donorCount);
      }
      if (d === 'stripe') {
        setDonateBanner('Thanks! If your gift does not show yet, wait a few seconds and refresh — we confirm it with Stripe.');
      } else {
        setDonateBanner('Checkout was cancelled.');
      }
      router.replace(`/campaigns/${encodeURIComponent(slug)}`, { scroll: false });
    })();
  }, [searchParams, slug, router, pollUntilDonationRecorded, silentRefreshCampaign]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center text-amber-950/80 sm:px-6">
        Loading campaign…
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <p className="text-lg text-amber-950">{error ?? 'Not found.'}</p>
        <Link href="/donate" className="mt-4 inline-block text-teal-800 underline">
          Back to campaigns
        </Link>
      </div>
    );
  }

  const approvalNote =
    campaign.approvalStatus === 'pending'
      ? 'This campaign is awaiting moderator approval before it appears to everyone.'
      : campaign.approvalStatus === 'rejected'
        ? 'This campaign was not approved. You can edit details and contact support if needed.'
        : null;

  return (
    <article className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {approvalNote ? (
        <div className="mb-6 rounded-xl border border-amber-400/50 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {approvalNote}
        </div>
      ) : null}
      {donateBanner ? (
        <div className="mb-6 rounded-xl border border-teal-600/25 bg-teal-50 px-4 py-3 text-sm text-teal-950">
          {donateBanner}
        </div>
      ) : null}
      <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <CampaignImageCarousel
            images={getCampaignImages(campaign)}
            alt=""
            aspectClass="aspect-[16/9]"
            className="rounded-3xl border border-amber-900/10 shadow-sm"
          />
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-900 ring-1 ring-amber-600/25">
              {campaign.status}
            </span>
            {campaign.approvalStatus ? (
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-800 ring-1 ring-zinc-400/30">
                Approval: {campaign.approvalStatus}
              </span>
            ) : null}
          </div>
          <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
            <h1 className="min-w-0 flex-1 text-3xl font-bold tracking-tight text-amber-950 sm:text-4xl">
              {campaign.title}
            </h1>
            <CampaignShareMenu slug={slug} title={campaign.title} />
          </div>
          <StatusLine status={campaign.status} />
          <p className="mt-5 text-lg leading-relaxed text-amber-950/85">{campaign.description}</p>
          <div className="mt-8 rounded-2xl border border-amber-900/10 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-950/55">Raised</p>
                <p className="text-2xl font-bold text-teal-800">{formatPhp(campaign.raisedAmount)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-950/55">Goal</p>
                <p className="text-xl font-semibold text-amber-950">{formatPhp(campaign.goalAmount)}</p>
              </div>
            </div>
            <div className="mt-4">
              <ProgressBar raised={campaign.raisedAmount} goal={campaign.goalAmount} />
            </div>
          </div>
        </div>

        <aside className="space-y-8 lg:pt-2">
          {api && campaign && canStripeDonate(campaign) ? (
            <CampaignStripeDonate slug={slug} api={api} onSuccess={onDonateSuccess} />
          ) : null}
          <section>
            <h2 className="text-xl font-bold text-amber-950">Recent donors</h2>
            <p className="mt-1 text-sm text-amber-950/70">
              Verified card gifts are shown to everyone; other pledges may stay pending until confirmed.
            </p>
            <div className="mt-4">
              <DonorsList donors={donors} />
            </div>
          </section>
        </aside>
      </div>
    </article>
  );
}
