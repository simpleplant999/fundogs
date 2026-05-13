'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { getClientApiBase, useAuth } from '@/providers/auth-provider';

type Summary = {
  userCount: number;
  organizationCount: number;
  campaignCount: number;
};

export default function AdminHomePage() {
  const { token, user } = useAuth();
  const api = getClientApiBase();
  const [summary, setSummary] = useState<Summary | null>(null);

  const load = useCallback(async () => {
    if (!api || !token) return;
    const res = await fetch(`${api}/admin/summary`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    setSummary(await res.json());
  }, [api, token]);

  useEffect(() => {
    if (token) void load();
  }, [token, load]);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-bold text-amber-950 sm:text-3xl">Overview</h1>
      <p className="mt-2 text-sm text-amber-950/75">
        Signed in as <span className="font-medium text-amber-950">{user?.email}</span>. Use the sidebar to manage
        users, organizations, and campaigns.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Link
          href="/admin/users"
          className="rounded-2xl border border-amber-900/10 bg-white p-5 shadow-sm transition hover:border-teal-700/30 hover:shadow-md"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-950/55">Users</p>
          <p className="mt-2 text-3xl font-bold text-amber-950">{summary?.userCount ?? '—'}</p>
          <p className="mt-2 text-sm text-teal-800">Manage accounts →</p>
        </Link>
        <Link
          href="/admin/organizations"
          className="rounded-2xl border border-amber-900/10 bg-white p-5 shadow-sm transition hover:border-teal-700/30 hover:shadow-md"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-950/55">Organizations</p>
          <p className="mt-2 text-3xl font-bold text-amber-950">{summary?.organizationCount ?? '—'}</p>
          <p className="mt-2 text-sm text-teal-800">Invite codes &amp; members →</p>
        </Link>
        <Link
          href="/admin/campaigns"
          className="rounded-2xl border border-amber-900/10 bg-white p-5 shadow-sm transition hover:border-teal-700/30 hover:shadow-md"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-950/55">Campaigns</p>
          <p className="mt-2 text-3xl font-bold text-amber-950">{summary?.campaignCount ?? '—'}</p>
          <p className="mt-2 text-sm text-teal-800">Moderation &amp; edits →</p>
        </Link>
      </div>
    </div>
  );
}
