'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AdminCampaignsTable } from '@/components/admin/admin-campaigns-table';
import { useAuth } from '@/providers/auth-provider';

export default function AdminCampaignsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) router.replace('/');
  }, [loading, user, router]);

  if (loading || !user || user.role !== 'ADMIN') {
    return <div className="px-4 py-16 text-center">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <p>
        <Link href="/admin" className="text-sm text-teal-800 underline">
          ← Admin dashboard
        </Link>
      </p>
      <h1 className="mt-4 text-3xl font-bold text-amber-950">Campaigns</h1>
      <div className="mt-8">
        <AdminCampaignsTable showHeading={false} />
      </div>
    </div>
  );
}
