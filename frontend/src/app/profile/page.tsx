'use client';

import Link from 'next/link';
import { useAuth } from '@/providers/auth-provider';

export default function ProfilePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="px-4 py-16 text-center">Loading…</div>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-14 sm:px-6">
        <h1 className="text-2xl font-bold text-amber-950">Profile</h1>
        <p className="mt-3 text-amber-950/80">
          <Link href="/auth/login" className="font-semibold text-teal-800 underline">
            Log in
          </Link>{' '}
          to see your account.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-amber-950">Your profile</h1>
      <div className="mt-8 space-y-4 rounded-2xl border border-amber-900/10 bg-white p-6 shadow-sm">
        <p>
          <span className="text-sm font-medium text-amber-950/60">Name</span>
          <br />
          <span className="text-lg text-amber-950">{user.fullName}</span>
        </p>
        <p>
          <span className="text-sm font-medium text-amber-950/60">Email</span>
          <br />
          <span className="text-lg text-amber-950">{user.email}</span>
        </p>
        <p>
          <span className="text-sm font-medium text-amber-950/60">Role</span>
          <br />
          <span className="text-lg text-amber-950">
            {user.role === 'ADMIN' ? 'Administrator' : 'Supporter'}
          </span>
        </p>
        <div className="flex flex-wrap gap-3 pt-4">
          <Link
            href="/campaigns/new"
            className="rounded-full bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
          >
            New campaign
          </Link>
          <Link
            href="/campaigns/dashboard"
            className="rounded-full px-4 py-2 text-sm font-medium text-amber-950 ring-1 ring-amber-900/15 hover:bg-amber-50"
          >
            My campaigns
          </Link>
          {user.role === 'ADMIN' ? (
            <Link
              href="/admin"
              className="rounded-full px-4 py-2 text-sm font-medium text-teal-900 ring-1 ring-teal-700/30 hover:bg-teal-50"
            >
              Admin panel
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
