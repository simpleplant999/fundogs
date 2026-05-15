'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  formatGoalAmountDisplay,
  formatGoalAmountFromNumber,
  parseGoalAmountInput,
} from '@/lib/goal-amount-input';
import { formatPhp } from '@/lib/format-currency';
import { withdrawalStatusLabel, withdrawalStatusPillClass } from '@/lib/withdrawal-request-status';

type BankAccount = {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  updatedAt: string;
};

type WithdrawalRequest = {
  id: string;
  amount: number;
  status: string;
  adminNote: string;
  createdAt: string;
};

type WithdrawalSummary = {
  raisedAmount: number;
  withdrawnAmount: number;
  pendingWithdrawalAmount: number;
  availableBalance: number;
};

function parseApiError(data: unknown): string {
  if (!data || typeof data !== 'object') return 'Request failed';
  const d = data as { message?: string | string[] };
  if (Array.isArray(d.message)) return d.message.join(', ');
  if (typeof d.message === 'string') return d.message;
  return 'Request failed';
}

export function CampaignWithdrawalsPanel({
  campaignId,
  api,
  token,
}: {
  campaignId: string;
  api: string;
  token: string;
}) {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [summary, setSummary] = useState<WithdrawalSummary | null>(null);
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [accountHolderName, setAccountHolderName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [requestAmount, setRequestAmount] = useState('');
  const [savingBank, setSavingBank] = useState(false);
  const [requesting, setRequesting] = useState(false);

  const load = useCallback(async () => {
    if (!api || !token) return;
    setLoading(true);
    setErr(null);
    try {
      const [bankRes, withdrawalsRes] = await Promise.all([
        fetch(`${api}/campaigns/me/${encodeURIComponent(campaignId)}/bank-account`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${api}/campaigns/me/${encodeURIComponent(campaignId)}/withdrawals`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      const bankData = (await bankRes.json().catch(() => null)) as BankAccount | null;
      const withdrawalsData = (await withdrawalsRes.json().catch(() => ({}))) as {
        summary?: WithdrawalSummary;
        requests?: WithdrawalRequest[];
        message?: string | string[];
      };
      if (!bankRes.ok) {
        setErr(parseApiError(bankData));
        return;
      }
      if (!withdrawalsRes.ok) {
        setErr(parseApiError(withdrawalsData));
        return;
      }
      if (bankData) {
        setAccountHolderName(bankData.accountHolderName);
        setBankName(bankData.bankName);
        setAccountNumber(bankData.accountNumber);
      }
      setSummary(withdrawalsData.summary ?? null);
      setRequests(withdrawalsData.requests ?? []);
    } finally {
      setLoading(false);
    }
  }, [api, token, campaignId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveBankAccount() {
    if (!api || !token) return;
    setSavingBank(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch(`${api}/campaigns/me/${encodeURIComponent(campaignId)}/bank-account`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountHolderName: accountHolderName.trim(),
          bankName: bankName.trim(),
          accountNumber: accountNumber.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(parseApiError(data));
        return;
      }
      setMsg('Bank details saved.');
      await load();
    } finally {
      setSavingBank(false);
    }
  }

  async function submitWithdrawal() {
    if (!api || !token) return;
    const amount = parseGoalAmountInput(requestAmount);
    if (!Number.isFinite(amount) || amount < 1) {
      setErr('Enter a valid withdrawal amount.');
      return;
    }
    setRequesting(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch(`${api}/campaigns/me/${encodeURIComponent(campaignId)}/withdrawals`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(parseApiError(data));
        return;
      }
      setRequestAmount('');
      setMsg('Withdrawal request submitted. An admin will review it manually.');
      await load();
    } finally {
      setRequesting(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-amber-950/65">Loading bank and withdrawal details…</p>;
  }

  return (
    <div className="space-y-5">
      <div>
        <h4 className="text-sm font-semibold text-amber-950">Bank account</h4>
        <p className="mt-1 text-xs text-amber-950/65">
          Only you and FunDogs admins can view these payout details.
        </p>
        <div className="mt-3 space-y-3">
          <label className="block text-sm font-medium text-amber-950">
            Account holder name
            <input
              value={accountHolderName}
              onChange={(e) => setAccountHolderName(e.target.value)}
              maxLength={120}
              className="mt-1 w-full rounded-lg border border-amber-900/15 px-3 py-2 text-sm outline-none ring-teal-600/30 focus:ring-2"
            />
          </label>
          <label className="block text-sm font-medium text-amber-950">
            Bank name
            <input
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              maxLength={120}
              className="mt-1 w-full rounded-lg border border-amber-900/15 px-3 py-2 text-sm outline-none ring-teal-600/30 focus:ring-2"
            />
          </label>
          <label className="block text-sm font-medium text-amber-950">
            Account number
            <input
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              maxLength={40}
              inputMode="numeric"
              className="mt-1 w-full rounded-lg border border-amber-900/15 px-3 py-2 font-mono text-sm outline-none ring-teal-600/30 focus:ring-2"
            />
          </label>
          <button
            type="button"
            disabled={savingBank}
            onClick={() => void saveBankAccount()}
            className="rounded-full bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
          >
            {savingBank ? 'Saving…' : 'Save bank details'}
          </button>
        </div>
      </div>

      {summary ? (
        <dl className="grid gap-3 rounded-xl border border-amber-900/10 bg-white p-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-amber-950/60">Raised</dt>
            <dd className="font-semibold text-amber-950">{formatPhp(summary.raisedAmount)}</dd>
          </div>
          <div>
            <dt className="text-amber-950/60">Withdrawn</dt>
            <dd className="font-semibold text-amber-950">{formatPhp(summary.withdrawnAmount)}</dd>
          </div>
          <div>
            <dt className="text-amber-950/60">Pending requests</dt>
            <dd className="font-semibold text-amber-950">{formatPhp(summary.pendingWithdrawalAmount)}</dd>
          </div>
          <div>
            <dt className="text-amber-950/60">Available balance</dt>
            <dd className="font-semibold text-teal-800">{formatPhp(summary.availableBalance)}</dd>
          </div>
        </dl>
      ) : null}

      <div>
        <h4 className="text-sm font-semibold text-amber-950">Request withdrawal</h4>
        <p className="mt-1 text-xs text-amber-950/65">
          Withdrawals are reviewed manually. Your available balance updates after an admin marks a payout as paid.
        </p>
        <label className="mt-3 block text-sm font-medium text-amber-950">
          Amount (PHP)
          <input
            type="text"
            inputMode="numeric"
            value={requestAmount}
            onChange={(e) => setRequestAmount(formatGoalAmountDisplay(e.target.value))}
            placeholder={summary ? formatGoalAmountFromNumber(summary.availableBalance) : '0'}
            className="mt-1 w-full rounded-lg border border-amber-900/15 px-3 py-2 text-sm outline-none ring-teal-600/30 focus:ring-2"
          />
        </label>
        <button
          type="button"
          disabled={requesting || !summary || summary.availableBalance < 1}
          onClick={() => void submitWithdrawal()}
          className="mt-3 rounded-full bg-amber-950 px-4 py-2 text-sm font-semibold text-amber-50 hover:bg-amber-900 disabled:opacity-60"
        >
          {requesting ? 'Submitting…' : 'Request withdrawal'}
        </button>
      </div>

      {requests.length > 0 ? (
        <div>
          <h4 className="text-sm font-semibold text-amber-950">Withdrawal history</h4>
          <ul className="mt-3 space-y-2">
            {requests.map((request) => (
              <li
                key={request.id}
                className="rounded-xl border border-amber-900/10 bg-white px-4 py-3 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-amber-950">{formatPhp(request.amount)}</span>
                  <span className={withdrawalStatusPillClass(request.status)}>
                    {withdrawalStatusLabel(request.status)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-amber-950/60">
                  Requested {new Date(request.createdAt).toLocaleString()}
                </p>
                {request.adminNote ? (
                  <p className="mt-2 text-xs text-amber-950/75">Admin note: {request.adminNote}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {err ? <p className="text-sm text-red-700">{err}</p> : null}
      {msg ? <p className="text-sm text-teal-800">{msg}</p> : null}
    </div>
  );
}
