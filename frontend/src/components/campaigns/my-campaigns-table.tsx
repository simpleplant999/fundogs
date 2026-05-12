'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useId, useState } from 'react';
import { CampaignImageCarousel } from '@/components/campaign-image-carousel';
import { CampaignImagesEditor } from '@/components/campaign-images-editor';
import { CampaignListThumb } from '@/components/campaign-list-thumb';
import { ProgressBar } from '@/components/progress-bar';
import { getCampaignImages } from '@/lib/campaign-images';
import {
  formatGoalAmountDisplay,
  formatGoalAmountFromNumber,
  parseGoalAmountInput,
} from '@/lib/goal-amount-input';
import type { Campaign } from '@/lib/types';
import { getClientApiBase, useAuth } from '@/providers/auth-provider';

function money(n: number) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(n);
}

function approvalLabel(s?: string) {
  if (!s) return '—';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function MyCampaignsTable() {
  const headingId = useId();
  const { token, user, loading } = useAuth();
  const router = useRouter();
  const api = getClientApiBase();
  const [rows, setRows] = useState<Campaign[]>([]);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [preview, setPreview] = useState<Campaign | null>(null);
  const [editRow, setEditRow] = useState<Campaign | null>(null);
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

  useEffect(() => {
    if (!editRow) return;
    setEditTitle(editRow.title);
    setEditDescription(editRow.description);
    setEditImageUrls(getCampaignImages(editRow));
    setEditGoal(formatGoalAmountFromNumber(editRow.goalAmount));
    setEditRecipientName(editRow.recipientName);
    setEditRecipientNote(editRow.recipientNote);
    setEditError(null);
  }, [editRow]);

  const modalOpen = !!(preview || editRow);

  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPreview(null);
        setEditRow(null);
      }
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [modalOpen]);

  async function saveEdit() {
    if (!api || !token || !editRow) return;
    setEditError(null);
    const wasRejected = editRow.approvalStatus === 'rejected';
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
      const res = await fetch(`${api}/campaigns/me/${editRow.id}`, {
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
        setEditError(
          typeof data.message === 'string'
            ? data.message
            : Array.isArray(data.message)
              ? data.message.join(', ')
              : 'Update failed',
        );
        return;
      }
      setEditRow(null);
      void load();
      setPreview(null);
      if (wasRejected && data.approvalStatus === 'pending') {
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
        Set <span className="font-mono text-xs">NEXT_PUBLIC_API_URL</span> in your env to load and edit campaigns.
      </p>
    );
  }

  if (loading || !user) {
    return <div className="py-8 text-center text-sm text-amber-950/70">Loading your campaigns…</div>;
  }

  return (
    <>
      {msg ? (
        <p className="mb-4 rounded-lg border border-teal-600/20 bg-teal-50 px-3 py-2 text-sm text-teal-900">{msg}</p>
      ) : null}
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
                <td className="whitespace-nowrap px-3 py-3 text-amber-950/80">{money(r.goalAmount)}</td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPreview(r)}
                      className="rounded-full bg-amber-950/10 px-2.5 py-1 text-xs font-medium text-amber-950 hover:bg-amber-950/15"
                    >
                      Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPreview(null);
                        setEditRow(r);
                      }}
                      className="rounded-full bg-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-900 hover:bg-zinc-300"
                    >
                      Edit
                    </button>
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

      {preview ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-amber-950/40 p-4 backdrop-blur-[2px]"
          role="presentation"
          onClick={() => setPreview(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${headingId}-pv-title`}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-amber-900/15 bg-[#fffaf3] p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <h3 id={`${headingId}-pv-title`} className="text-xl font-bold text-amber-950">
                {preview.title}
              </h3>
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="shrink-0 rounded-full px-2 py-1 text-sm text-amber-950/70 hover:bg-amber-900/10"
                aria-label="Close preview"
              >
                ✕
              </button>
            </div>
            <p className="mt-1 text-xs text-amber-950/60">/{preview.slug}</p>
            <div className="mt-4">
              <CampaignImageCarousel
                images={getCampaignImages(preview)}
                alt=""
                aspectClass="aspect-[16/10]"
              />
            </div>
            <p className="mt-4 whitespace-pre-wrap text-sm text-amber-950/85">{preview.description}</p>
            <div className="mt-4 rounded-2xl border border-amber-900/10 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-950/55">Raised</p>
                  <p className="text-2xl font-bold text-teal-800">{money(preview.raisedAmount)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-950/55">Goal</p>
                  <p className="text-xl font-semibold text-amber-950">{money(preview.goalAmount)}</p>
                </div>
              </div>
              <div className="mt-4">
                <ProgressBar raised={preview.raisedAmount} goal={preview.goalAmount} />
              </div>
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4 border-t border-amber-900/10 pt-3">
                <dt className="text-amber-950/60">Recipient</dt>
                <dd className="text-right font-medium text-amber-950">{preview.recipientName}</dd>
              </div>
              <div className="flex flex-col gap-1 border-t border-amber-900/10 pt-3">
                <dt className="text-amber-950/60">Recipient note</dt>
                <dd className="text-amber-950/85">{preview.recipientNote || '—'}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-amber-950/60">Approval</dt>
                <dd className="font-medium text-amber-950">{approvalLabel(preview.approvalStatus)}</dd>
              </div>
            </dl>
            <div className="mt-6 flex flex-wrap gap-2 border-t border-amber-900/10 pt-4">
              <Link
                href={`/campaigns/${preview.slug}`}
                className="rounded-full px-4 py-2 text-sm font-medium text-teal-800 underline"
              >
                Open campaign page
              </Link>
              <button
                type="button"
                onClick={() => {
                  setEditRow(preview);
                  setPreview(null);
                }}
                className="rounded-full bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-300"
              >
                Edit campaign
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {editRow ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-amber-950/40 p-4 backdrop-blur-[2px]"
          role="presentation"
          onClick={() => !editSaving && setEditRow(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${headingId}-ed-title`}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-amber-900/15 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id={`${headingId}-ed-title`} className="text-xl font-bold text-amber-950">
              Edit campaign
            </h3>
            <p className="mt-1 text-xs text-amber-950/60">Slug stays the same: /{editRow.slug}</p>
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
                  onClick={() => setEditRow(null)}
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
        </div>
      ) : null}
    </>
  );
}
