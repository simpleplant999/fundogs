'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { MyCampaignsTable } from '@/components/campaigns/my-campaigns-table';
import { useAuth } from '@/providers/auth-provider';

export default function MyCampaignsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/auth/login');
  }, [loading, user, router]);

  if (loading || !user) {
    return <div className="px-4 py-16 text-center">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-amber-950">My campaigns</h1>
      <p className="mt-2 max-w-2xl text-sm text-amber-950/75">
        Preview any campaign in a modal (with progress toward your goal). Use <strong>Edit</strong> to update
        details. If a campaign was <strong>rejected</strong>, saving changes sends it back to{' '}
        <strong>pending</strong> for admin review.
      </p>
      <Link
        href="/campaigns/new"
        className="mt-6 inline-flex rounded-full bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
      >
        New campaign
      </Link>

      <div className="mt-10 rounded-2xl border border-amber-900/10 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-bold text-amber-950">Your campaigns</h2>
        <div className="mt-4">
          <MyCampaignsTable />
        </div>
      </div>
    </div>
  );
}
