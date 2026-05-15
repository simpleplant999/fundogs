'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { formatPhp } from '@/lib/format-currency';
import { withdrawalStatusLabel, withdrawalStatusPillClass } from '@/lib/withdrawal-request-status';
import { getClientApiBase, useAuth } from '@/providers/auth-provider';

type AdminWithdrawalRow = {
  id: string;
  amount: number;
  status: string;
  adminNote: string;
  createdAt: string;
  campaign: {
    id: string;
    slug: string;
    title: string;
    raisedAmount: number;
    withdrawnAmount: number;
  };
  requestedBy: {
    id: string;
    fullName: string;
    email: string;
  };
  bankAccount: {
    accountHolderName: string;
    bankName: string;
    accountNumber: string;
  } | null;
};

function statusLabel(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

function parseApiError(data: unknown): string {
  if (!data || typeof data !== 'object') return 'Request failed';
  const d = data as { message?: string | string[] };
  if (Array.isArray(d.message)) return d.message.join(', ');
  if (typeof d.message === 'string') return d.message;
  return 'Request failed';
}

export function AdminWithdrawalsTable() {
  const { token, user, loading } = useAuth();
  const router = useRouter();
  const api = getClientApiBase();
  const [rows, setRows] = useState<AdminWithdrawalRow[]>([]);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!api || !token) return;
    const res = await fetch(`${api}/admin/withdrawals`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 403 || res.status === 401) {
      router.replace('/');
      return;
    }
    if (!res.ok) {
      setLoadErr('Could not load withdrawal requests.');
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

  async function updateStatus(row: AdminWithdrawalRow, status: 'APPROVED' | 'REJECTED' | 'PAID') {
    if (!api || !token) return;
    const adminNote = window.prompt('Optional admin note for this withdrawal request:', row.adminNote) ?? row.adminNote;
    setBusyId(row.id);
    setMsg(null);
    try {
      const res = await fetch(`${api}/admin/withdrawals/${encodeURIComponent(row.id)}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, adminNote }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(parseApiError(data));
        return;
      }
      setMsg(`Withdrawal marked ${withdrawalStatusLabel(status).toLowerCase()}.`);
      await load();
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return <div className="py-8 text-center text-sm text-amber-950/70">Loading…</div>;
  }

  if (loadErr) {
    return <p className="text-sm text-red-700">{loadErr}</p>;
  }

  return (
    <div>
      {msg ? <p className="mb-4 text-sm text-teal-800">{msg}</p> : null}
      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-amber-900/15 bg-amber-50/50 px-4 py-8 text-center text-sm text-amber-950/70">
          No withdrawal requests yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-amber-900/10 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-amber-900/10 bg-amber-50/70 text-xs uppercase tracking-wide text-amber-950/60">
              <tr>
                <th className="px-3 py-3">Campaign</th>
                <th className="px-3 py-3">Creator</th>
                <th className="px-3 py-3">Amount</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Bank details</th>
                <th className="px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-amber-900/10 align-top">
                  <td className="px-3 py-3">
                    <p className="font-medium text-amber-950">{row.campaign.title}</p>
                    <Link href={`/campaigns/${row.campaign.slug}`} className="text-xs text-teal-800 underline">
                      /{row.campaign.slug}
                    </Link>
                    <p className="mt-2 text-xs text-amber-950/65">
                      Raised {formatPhp(row.campaign.raisedAmount)} · Withdrawn {formatPhp(row.campaign.withdrawnAmount)}
                    </p>
                  </td>
                  <td className="px-3 py-3">
                    <p className="font-medium text-amber-950">{row.requestedBy.fullName}</p>
                    <p className="text-xs text-amber-950/65">{row.requestedBy.email}</p>
                  </td>
                  <td className="px-3 py-3 font-semibold text-amber-950">{formatPhp(row.amount)}</td>
                  <td className="px-3 py-3">
                    <span className={withdrawalStatusPillClass(row.status)}>
                      {withdrawalStatusLabel(row.status)}
                    </span>
                    <p className="mt-2 text-xs text-amber-950/60">{new Date(row.createdAt).toLocaleString()}</p>
                    {row.adminNote ? <p className="mt-2 text-xs text-amber-950/75">Note: {row.adminNote}</p> : null}
                  </td>
                  <td className="px-3 py-3 text-xs text-amber-950/80">
                    {row.bankAccount ? (
                      <div className="space-y-1">
                        <p>{row.bankAccount.accountHolderName}</p>
                        <p>{row.bankAccount.bankName}</p>
                        <p className="font-mono">{row.bankAccount.accountNumber}</p>
                      </div>
                    ) : (
                      <span className="text-amber-950/50">No bank details</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        disabled={busyId === row.id || row.status === 'PAID' || row.status === 'REJECTED'}
                        onClick={() => void updateStatus(row, 'APPROVED')}
                        className="rounded-full bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={busyId === row.id || row.status === 'PAID' || row.status === 'REJECTED'}
                        onClick={() => void updateStatus(row, 'PAID')}
                        className="rounded-full bg-amber-950 px-3 py-1.5 text-xs font-semibold text-amber-50 hover:bg-amber-900 disabled:opacity-50"
                      >
                        Mark paid
                      </button>
                      <button
                        type="button"
                        disabled={busyId === row.id || row.status === 'PAID' || row.status === 'REJECTED'}
                        onClick={() => void updateStatus(row, 'REJECTED')}
                        className="rounded-full bg-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-900 hover:bg-zinc-300 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
