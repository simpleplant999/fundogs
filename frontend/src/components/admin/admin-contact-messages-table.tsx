'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { getClientApiBase, useAuth } from '@/providers/auth-provider';

export type AdminContactMessageRow = {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  category: 'REPORT_PROBLEM' | 'GENERAL_QUESTION';
  message: string;
};

function categoryLabel(c: AdminContactMessageRow['category']) {
  return c === 'REPORT_PROBLEM' ? 'Report' : 'General';
}

function categoryPillClass(c: AdminContactMessageRow['category']) {
  return c === 'REPORT_PROBLEM'
    ? 'bg-rose-100 text-rose-900 ring-rose-600/20'
    : 'bg-sky-100 text-sky-900 ring-sky-600/20';
}

function previewText(s: string, max = 90) {
  const t = s.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

export function AdminContactMessagesTable() {
  const { token, user, loading } = useAuth();
  const router = useRouter();
  const api = getClientApiBase();
  const [rows, setRows] = useState<AdminContactMessageRow[]>([]);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!api || !token) return;
    const res = await fetch(`${api}/admin/contact-messages`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 403 || res.status === 401) {
      router.replace('/');
      return;
    }
    if (!res.ok) {
      setLoadErr('Could not load contact messages.');
      return;
    }
    setRows(await res.json());
    setLoadErr(null);
  }, [api, token, router]);

  useEffect(() => {
    if (!loading && user?.role !== 'ADMIN') router.replace('/');
  }, [loading, user, router]);

  useEffect(() => {
    if (user?.role === 'ADMIN' && token) void load();
  }, [user, token, load]);

  if (loading) {
    return <div className="py-8 text-center text-sm text-amber-950/70">Loading…</div>;
  }

  if (loadErr) {
    return <p className="text-sm text-red-700">{loadErr}</p>;
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-amber-950/60">
          Newest first (up to 500). Submissions come from the public{' '}
          <Link href="/contact" className="font-medium text-teal-800 underline">
            contact form
          </Link>
          .
        </p>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-amber-950 ring-1 ring-amber-900/15 hover:bg-amber-50"
        >
          Refresh
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-amber-900/15 bg-amber-50/50 px-4 py-8 text-center text-sm text-amber-950/70">
          No contact messages yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-amber-900/10 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-amber-900/10 bg-amber-50/70 text-xs uppercase tracking-wide text-amber-950/60">
              <tr>
                <th className="px-3 py-3">Received</th>
                <th className="px-3 py-3">Topic</th>
                <th className="px-3 py-3">From</th>
                <th className="px-3 py-3">Message</th>
                <th className="px-3 py-3"> </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-900/10">
              {rows.map((row) => {
                const open = openId === row.id;
                return (
                  <tr key={row.id} className="align-top text-amber-950">
                    <td className="whitespace-nowrap px-3 py-3 text-xs text-amber-950/75">
                      {new Date(row.createdAt).toLocaleString(undefined, {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${categoryPillClass(row.category)}`}
                      >
                        {categoryLabel(row.category)}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-medium text-amber-950">{row.name}</p>
                      <a
                        href={`mailto:${row.email}?subject=${encodeURIComponent(`Re: FunDogs (${categoryLabel(row.category)})`)}`}
                        className="text-xs text-teal-800 underline-offset-2 hover:underline"
                      >
                        {row.email}
                      </a>
                    </td>
                    <td className="max-w-md px-3 py-3 text-amber-950/85">
                      <p className="whitespace-pre-wrap break-words text-xs leading-relaxed">
                        {open ? row.message : previewText(row.message)}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setOpenId(open ? null : row.id)}
                        className="text-xs font-semibold text-teal-800 hover:underline"
                      >
                        {open ? 'Collapse' : 'Expand'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
