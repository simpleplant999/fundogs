'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { CampaignPaymongoDonate } from '@/components/campaign-paymongo-donate';
import { getClientApiBase } from '@/providers/auth-provider';

const highlights = [
  {
    title: 'Keep the platform online',
    body: 'Hosting, security updates, and payment tooling so rescues can keep fundraising without interruption.',
  },
  {
    title: 'Support more animals',
    body: 'Your gift helps us onboard shelters, improve campaign tools, and reach more people who can help.',
  },
  {
    title: 'Transparent by design',
    body: 'FunDogs is built for community trust. Platform support is separate from individual rescue campaigns.',
  },
];

export function SupportPageClient() {
  const api = useMemo(() => getClientApiBase(), []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <header className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-teal-800">Support FunDogs</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-amber-950 sm:text-4xl">
          Help us keep FunDogs running for every rescue
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-amber-950/80">
          FunDogs is free for visitors and campaign creators. Your support funds the project so we can maintain the
          platform, cover operating costs, and help more animals find care and forever homes.
        </p>
      </header>

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-start">
        <section className="space-y-6">
          <div className="rounded-2xl border border-amber-900/10 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-amber-950">Where your gift goes</h2>
            <ul className="mt-4 space-y-4">
              {highlights.map((item) => (
                <li key={item.title} className="rounded-xl border border-amber-900/10 bg-amber-50/40 p-4">
                  <p className="font-semibold text-amber-950">{item.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-amber-950/75">{item.body}</p>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-sm text-amber-950/70">
            Looking to help a specific rescue?{' '}
            <Link href="/donate" className="font-medium text-teal-800 underline-offset-4 hover:underline">
              Browse active campaigns
            </Link>
            .
          </p>
        </section>

        <div className="lg:sticky lg:top-24">
          {api ? (
            <CampaignPaymongoDonate
              scope="platform"
              api={api}
              campaignTitle="FunDogs platform support"
              campaignDescription="Support FunDogs operations and help us reach more animals in need."
              sectionTitle="Give to FunDogs"
              sectionIntro="Choose QR Ph or card. Minimum PHP 20. Your name can appear on our supporter list."
              successMessage="Thank you for supporting FunDogs. Your gift helps keep the platform running for rescues and adopters."
            />
          ) : (
            <div className="rounded-2xl border border-amber-900/10 bg-white p-5 text-sm text-amber-950/75 shadow-sm">
              Online giving is unavailable until <span className="font-mono">NEXT_PUBLIC_API_URL</span> is configured.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
