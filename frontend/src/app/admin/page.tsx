'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AdminCampaignsTable } from '@/components/admin/admin-campaigns-table';
import { useAuth } from '@/providers/auth-provider';

export default function AdminHomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) {
      router.replace('/');
    }
  }, [loading, user, router]);

  if (loading || !user || user.role !== 'ADMIN') {
    return <div className="px-4 py-16 text-center">Checking access…</div>;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-amber-950">Admin dashboard</h1>
      <p className="mt-2 text-amber-950/75">
        Signed in as <span className="font-medium text-amber-950">{user.email}</span>. Review campaigns in
        the table, use <strong>Preview</strong> for details, then approve or reject when pending.
      </p>
      <p className="mt-3 text-sm text-amber-950/65">
        <Link href="/" className="text-teal-800 underline">
          Home
        </Link>
        {' · '}
        <Link href="/profile" className="text-teal-800 underline">
          Profile
        </Link>
        {' · '}
        <Link href="/admin/campaigns" className="text-teal-800 underline">
          Campaigns (wide)
        </Link>
      </p>

      <div className="mt-10">
        <AdminCampaignsTable />
      </div>
    </div>
  );
}
