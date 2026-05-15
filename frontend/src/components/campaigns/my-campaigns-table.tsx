'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { CampaignListThumb } from '@/components/campaign-list-thumb';
import { formatPhp } from '@/lib/format-currency';
import type { Campaign } from '@/lib/types';
import { getClientApiBase, useAuth } from '@/providers/auth-provider';

function approvalLabel(s?: string) {
  if (!s) return '—';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function MyCampaignsTable() {
  const { token, user, loading } = useAuth();
  const router = useRouter();
  const api = getClientApiBase();
  const [rows, setRows] = useState<Campaign[]>([]);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!api || !token) return;
    const res = await fetch(`${api}/campaigns/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) {
      router.replace('/auth/login');
      return;
    }
    if (!res.ok) {
      setLoadErr('Could not load your campaigns.');
      return;
    }
    setRows(await res.json());
    setLoadErr(null);
  }, [api, token, router]);

  useEffect(() => {
    if (!loading && !user) router.replace('/auth/login');
  }, [loading, user, router]);

  useEffect(() => {
    if (user && token) void load();
  }, [user, token, load]);

  if (!api) {
    return (
      <p className="py-4 text-sm text-amber-950/75">
        Set <span className="font-mono text-xs">NEXT_PUBLIC_API_URL</span> in your env to load and edit campaigns.
      </p>
    );
  }

  if (loading || !user) {
    return <div className="py-8 text-center text-sm text-amber-950/70">Loading your campaigns…</div>;
  }

  return (
    <>
      {loadErr ? <p className="mb-4 text-sm text-red-700">{loadErr}</p> : null}
      <div className="overflow-x-auto rounded-lg border border-amber-900/10">
        <table className="min-w-[700px] w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-amber-900/10 bg-amber-50/80 text-xs font-semibold uppercase tracking-wide text-amber-950/70">
              <th className="px-3 py-3">Campaign</th>
              <th className="px-3 py-3">Lifecycle</th>
              <th className="px-3 py-3">Approval</th>
              <th className="px-3 py-3">Goal</th>
              <th className="px-3 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-amber-900/5 odd:bg-white even:bg-amber-50/30">
                <td className="max-w-[280px] px-3 py-3">
                  <div className="flex items-start gap-3">
                    <CampaignListThumb imageUrl={r.imageUrl} title={r.title} />
                    <div className="min-w-0 flex-1 font-medium text-amber-950">
                      <span className="line-clamp-2">{r.title}</span>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-amber-950/75">{r.status}</td>
                <td className="whitespace-nowrap px-3 py-3">
                  <span
                    className={
                      r.approvalStatus === 'pending'
                        ? 'rounded-full bg-amber-200/80 px-2 py-0.5 text-xs font-medium text-amber-950'
                        : r.approvalStatus === 'approved'
                          ? 'rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-900'
                          : 'rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900'
                    }
                  >
                    {approvalLabel(r.approvalStatus)}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-amber-950/80">{formatPhp(r.goalAmount)}</td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap justify-end gap-1.5">
                    <Link
                      href={`/campaigns/dashboard/${encodeURIComponent(r.id)}`}
                      className="rounded-full bg-amber-950/10 px-2.5 py-1 text-xs font-medium text-amber-950 hover:bg-amber-950/15"
                    >
                      Open
                    </Link>
                    <Link
                      href={`/campaigns/dashboard/${encodeURIComponent(r.id)}?edit=1`}
                      className="rounded-full bg-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-900 hover:bg-zinc-300"
                    >
                      Edit
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length && !loadErr ? (
        <p className="mt-6 text-sm text-amber-950/70">No campaigns yet. Create one to get started.</p>
      ) : null}
    </>
  );
}
