'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useId, useState } from 'react';
import { CampaignImageCarousel } from '@/components/campaign-image-carousel';
import { CampaignImagesEditor } from '@/components/campaign-images-editor';
import { CampaignWithdrawalsPanel } from '@/components/campaigns/campaign-withdrawals-panel';
import { ProgressBar } from '@/components/progress-bar';
import { getCampaignImages } from '@/lib/campaign-images';
import {
  formatGoalAmountDisplay,
  formatGoalAmountFromNumber,
  parseGoalAmountInput,
} from '@/lib/goal-amount-input';
import { formatPhp } from '@/lib/format-currency';
import type { Campaign } from '@/lib/types';
import { getClientApiBase, useAuth } from '@/providers/auth-provider';

type DetailTab = 'overview' | 'withdrawals';

function approvalLabel(s?: string) {
  if (!s) return '—';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function parseApiError(data: unknown): string {
  if (!data || typeof data !== 'object') return 'Update failed';
  const d = data as { message?: string | string[] };
  if (Array.isArray(d.message)) return d.message.join(', ');
  if (typeof d.message === 'string') return d.message;
  return 'Update failed';
}

export function MyCampaignDetailClient({
  campaignId,
  initialEdit = false,
}: {
  campaignId: string;
  initialEdit?: boolean;
}) {
  const tabListId = useId();
  const { token, user, loading } = useAuth();
  const router = useRouter();
  const api = getClientApiBase();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [tab, setTab] = useState<DetailTab>('overview');
  const [editing, setEditing] = useState(initialEdit);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editImageUrls, setEditImageUrls] = useState<string[]>([]);
  const [editGoal, setEditGoal] = useState('');
  const [editRecipientName, setEditRecipientName] = useState('');
  const [editRecipientNote, setEditRecipientNote] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);

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
      setLoadErr('Could not load this campaign.');
      return;
    }
    const rows = (await res.json()) as Campaign[];
    const row = rows.find((r) => r.id === campaignId) ?? null;
    if (!row) {
      setCampaign(null);
      setLoadErr('Campaign not found.');
      return;
    }
    setCampaign(row);
    setLoadErr(null);
  }, [api, token, router, campaignId]);

  useEffect(() => {
    if (!loading && !user) router.replace('/auth/login');
  }, [loading, user, router]);

  useEffect(() => {
    if (user && token) void load();
  }, [user, token, load]);

  useEffect(() => {
    if (!campaign) return;
    setEditTitle(campaign.title);
    setEditDescription(campaign.description);
    setEditImageUrls(getCampaignImages(campaign));
    setEditGoal(formatGoalAmountFromNumber(campaign.goalAmount));
    setEditRecipientName(campaign.recipientName);
    setEditRecipientNote(campaign.recipientNote);
    setEditError(null);
  }, [campaign]);

  useEffect(() => {
    setEditing(initialEdit);
  }, [initialEdit]);

  async function saveEdit() {
    if (!api || !token || !campaign) return;
    setEditError(null);
    const wasRejected = campaign.approvalStatus === 'rejected';
    const goal = parseGoalAmountInput(editGoal);
    if (!Number.isFinite(goal) || goal < 1) {
      setEditError('Enter a valid goal amount (at least 1).');
      return;
    }
    if (editTitle.trim().length < 3) {
      setEditError('Title must be at least 3 characters.');
      return;
    }
    if (editDescription.trim().length < 10) {
      setEditError('Description must be at least 10 characters.');
      return;
    }
    if (editImageUrls.length < 1) {
      setEditError('Add at least one campaign image.');
      return;
    }
    setEditSaving(true);
    try {
      const res = await fetch(`${api}/campaigns/me/${campaign.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim(),
          imageUrls: editImageUrls,
          goalAmount: goal,
          recipientName: editRecipientName.trim(),
          recipientNote: editRecipientNote.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setEditError(parseApiError(data));
        return;
      }
      setCampaign(data as Campaign);
      setEditing(false);
      if (wasRejected && (data as Campaign).approvalStatus === 'pending') {
        setMsg('Campaign updated and sent back for admin review.');
      } else {
        setMsg('Campaign updated.');
      }
    } finally {
      setEditSaving(false);
    }
  }

  if (!api) {
    return (
      <p className="py-4 text-sm text-amber-950/75">
        Set <span className="font-mono text-xs">NEXT_PUBLIC_API_URL</span> in your env to manage campaigns.
      </p>
    );
  }

  if (loading || !user) {
    return <div className="px-4 py-16 text-center text-amber-950/75">Loading…</div>;
  }

  if (loadErr) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
        <h1 className="text-2xl font-bold text-amber-950">Campaign not found</h1>
        <p className="mt-3 text-amber-950/75">{loadErr}</p>
        <p className="mt-4">
          <Link href="/campaigns/dashboard" className="text-teal-800 underline">
            Back to my campaigns
          </Link>
        </p>
      </div>
    );
  }

  if (!campaign) {
    return <div className="px-4 py-16 text-center text-amber-950/75">Loading campaign…</div>;
  }

  const tabs: { id: DetailTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'withdrawals', label: 'Withdrawal requests' },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <Link href="/campaigns/dashboard" className="text-sm font-medium text-teal-800 hover:underline">
        ← Back to my campaigns
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-amber-950">{campaign.title}</h1>
          <p className="mt-1 text-sm text-amber-950/65">/{campaign.slug}</p>
        </div>
        {!editing ? (
          <button
            type="button"
            onClick={() => {
              setMsg(null);
              setEditing(true);
              setTab('overview');
            }}
            className="rounded-full bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-300"
          >
            Edit campaign
          </button>
        ) : null}
      </div>

      {msg ? (
        <p className="mt-4 rounded-lg border border-teal-600/20 bg-teal-50 px-3 py-2 text-sm text-teal-900">{msg}</p>
      ) : null}

      {editing ? (
        <div className="mt-8 rounded-2xl border border-amber-900/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-amber-950">Edit campaign</h2>
          <p className="mt-1 text-xs text-amber-950/60">Slug stays the same: /{campaign.slug}</p>
          <form
            className="mt-5 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void saveEdit();
            }}
          >
            <label className="block text-sm font-medium text-amber-950">
              Title
              <input
                required
                minLength={3}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="mt-1 w-full rounded-lg border border-amber-900/15 px-3 py-2 outline-none ring-teal-600/30 focus:ring-2"
              />
            </label>
            <label className="block text-sm font-medium text-amber-950">
              Description
              <textarea
                required
                minLength={10}
                rows={5}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="mt-1 w-full rounded-lg border border-amber-900/15 px-3 py-2 outline-none ring-teal-600/30 focus:ring-2"
              />
            </label>
            {token ? (
              <CampaignImagesEditor
                images={editImageUrls}
                onChange={setEditImageUrls}
                token={token}
                api={api}
                disabled={editSaving}
              />
            ) : null}
            <label className="block text-sm font-medium text-amber-950">
              Goal amount
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                required
                placeholder="e.g. 500,000"
                value={editGoal}
                onChange={(e) => setEditGoal(formatGoalAmountDisplay(e.target.value))}
                className="mt-1 w-full rounded-lg border border-amber-900/15 px-3 py-2 outline-none ring-teal-600/30 focus:ring-2"
              />
            </label>
            <label className="block text-sm font-medium text-amber-950">
              Recipient name
              <input
                required
                value={editRecipientName}
                onChange={(e) => setEditRecipientName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-amber-900/15 px-3 py-2 outline-none ring-teal-600/30 focus:ring-2"
              />
            </label>
            <label className="block text-sm font-medium text-amber-950">
              Recipient note
              <textarea
                required
                rows={2}
                value={editRecipientNote}
                onChange={(e) => setEditRecipientNote(e.target.value)}
                className="mt-1 w-full rounded-lg border border-amber-900/15 px-3 py-2 outline-none ring-teal-600/30 focus:ring-2"
              />
            </label>
            {editError ? <p className="text-sm text-red-700">{editError}</p> : null}
            <div className="flex flex-wrap gap-2 border-t border-amber-900/10 pt-4">
              <button
                type="button"
                disabled={editSaving}
                onClick={() => setEditing(false)}
                className="rounded-full px-4 py-2 text-sm font-medium text-amber-950 ring-1 ring-amber-900/20 hover:bg-amber-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editSaving}
                className="rounded-full bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
              >
                {editSaving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <>
          <nav
            id={tabListId}
            role="tablist"
            aria-label="Campaign sections"
            className="mt-8 flex flex-wrap gap-2 border-b border-amber-900/10"
          >
            {tabs.map((item) => (
              <button
                key={item.id}
                id={`${tabListId}-${item.id}`}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                aria-controls={`${tabListId}-panel-${item.id}`}
                onClick={() => setTab(item.id)}
                className={`rounded-t-lg px-4 py-2 text-sm font-medium transition ${
                  tab === item.id
                    ? 'bg-white text-amber-950 shadow-[inset_0_-2px_0_0_#0f766e]'
                    : 'text-amber-950/70 hover:bg-amber-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div
            id={`${tabListId}-panel-overview`}
            role="tabpanel"
            aria-labelledby={`${tabListId}-overview`}
            hidden={tab !== 'overview'}
            className="rounded-b-2xl rounded-tr-2xl border border-amber-900/10 bg-white p-6 shadow-sm"
          >
            <CampaignImageCarousel images={getCampaignImages(campaign)} alt="" aspectClass="aspect-[16/10]" />
            <p className="mt-4 whitespace-pre-wrap text-sm text-amber-950/85">{campaign.description}</p>
            <div className="mt-4 rounded-2xl border border-amber-900/10 bg-amber-50/40 p-5">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-950/55">Raised</p>
                  <p className="text-2xl font-bold text-teal-800">{formatPhp(campaign.raisedAmount)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-950/55">Goal</p>
                  <p className="text-xl font-semibold text-amber-950">{formatPhp(campaign.goalAmount)}</p>
                </div>
              </div>
              <div className="mt-4">
                <ProgressBar raised={campaign.raisedAmount} goal={campaign.goalAmount} />
              </div>
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4 border-t border-amber-900/10 pt-3">
                <dt className="text-amber-950/60">Lifecycle</dt>
                <dd className="font-medium text-amber-950">{campaign.status}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-amber-950/60">Approval</dt>
                <dd className="font-medium text-amber-950">{approvalLabel(campaign.approvalStatus)}</dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-amber-900/10 pt-3">
                <dt className="text-amber-950/60">Recipient</dt>
                <dd className="text-right font-medium text-amber-950">{campaign.recipientName}</dd>
              </div>
              <div className="flex flex-col gap-1 border-t border-amber-900/10 pt-3">
                <dt className="text-amber-950/60">Recipient note</dt>
                <dd className="text-amber-950/85">{campaign.recipientNote || '—'}</dd>
              </div>
            </dl>
            <div className="mt-6 border-t border-amber-900/10 pt-4">
              <Link
                href={`/campaigns/${campaign.slug}`}
                className="text-sm font-medium text-teal-800 underline"
              >
                Open public campaign page
              </Link>
            </div>
          </div>

          <div
            id={`${tabListId}-panel-withdrawals`}
            role="tabpanel"
            aria-labelledby={`${tabListId}-withdrawals`}
            hidden={tab !== 'withdrawals'}
            className="rounded-b-2xl rounded-tr-2xl border border-amber-900/10 bg-white p-6 shadow-sm"
          >
            {token ? <CampaignWithdrawalsPanel campaignId={campaign.id} api={api} token={token} /> : null}
          </div>
        </>
      )}
    </div>
  );
}
