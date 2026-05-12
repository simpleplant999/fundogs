'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/providers/auth-provider';

/** Comment moderation UI is disabled for now; route kept for bookmarks. */
export default function AdminCommentsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) router.replace('/');
  }, [loading, user, router]);

  if (loading || !user || user.role !== 'ADMIN') {
    return <div className="px-4 py-16 text-center">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
      <p>
        <Link href="/admin" className="text-sm text-teal-800 underline">
          ← Admin dashboard
        </Link>
      </p>
      <h1 className="mt-4 text-2xl font-bold text-amber-950">Comments</h1>
      <p className="mt-3 text-amber-950/80">
        Comment moderation is turned off in the app for now. The campaigns table on the admin dashboard is
        unchanged.
      </p>
    </div>
  );
}
