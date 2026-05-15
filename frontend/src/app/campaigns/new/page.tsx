'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CampaignImagesEditor } from '@/components/campaign-images-editor';
import {
  formatGoalAmountDisplay,
  formatGoalAmountFromNumber,
  parseGoalAmountInput,
} from '@/lib/goal-amount-input';
import { CAMPAIGN_TYPES, CAMPAIGN_TYPE_LABELS } from '@/lib/campaign-type';
import type { Campaign } from '@/lib/types';
import { getClientApiBase, useAuth } from '@/providers/auth-provider';

export default function NewCampaignPage() {
  const { token, user, loading } = useAuth();
  const router = useRouter();
  const api = getClientApiBase();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [goalAmount, setGoalAmount] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientNote, setRecipientNote] = useState('');
  const [campaignType, setCampaignType] = useState<string>('other');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace('/auth/login');
  }, [loading, user, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!api || !token) return;
    setError(null);
    setSubmitting(true);
    const goal = parseGoalAmountInput(goalAmount);
    if (!Number.isFinite(goal) || goal < 1) {
      setError('Enter a valid goal amount.');
      setSubmitting(false);
      return;
    }
    const res = await fetch(`${api}/campaigns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title,
        description,
        ...(imageUrls.length ? { imageUrls } : {}),
        goalAmount: goal,
        recipientName,
        recipientNote,
        campaignType,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(
        typeof data.message === 'string'
          ? data.message
          : Array.isArray(data.message)
            ? data.message.join(', ')
            : 'Could not create campaign',
      );
      setSubmitting(false);
      return;
    }
    const c = data as Campaign;
    router.push(`/campaigns/${c.slug}`);
  }

  if (loading || !user) {
    return <div className="px-4 py-16 text-center text-amber-950/75">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-amber-950">Start a campaign</h1>
      <p className="mt-2 text-sm text-amber-950/75">
        Your campaign stays in <strong>draft</strong> with <strong>pending approval</strong> until an admin publishes
        it.
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-2xl border border-amber-900/10 bg-white p-6 shadow-sm">
        <label className="block text-sm font-medium text-amber-950">
          Title
          <input
            required
            minLength={3}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-lg border border-amber-900/15 px-3 py-2 outline-none ring-teal-600/30 focus:ring-2"
          />
        </label>
        <label className="block text-sm font-medium text-amber-950">
          Description
          <textarea
            required
            minLength={10}
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 w-full rounded-lg border border-amber-900/15 px-3 py-2 outline-none ring-teal-600/30 focus:ring-2"
          />
        </label>
        {token ? (
          <CampaignImagesEditor
            images={imageUrls}
            onChange={setImageUrls}
            token={token}
            api={api}
            disabled={submitting}
          />
        ) : (
          <p className="text-sm text-amber-950/70">Sign in to upload images.</p>
        )}
        <label className="block text-sm font-medium text-amber-950">
          Campaign type
          <select
            required
            value={campaignType}
            onChange={(e) => setCampaignType(e.target.value)}
            className="mt-1 w-full rounded-lg border border-amber-900/15 bg-white px-3 py-2 outline-none ring-teal-600/30 focus:ring-2"
          >
            {CAMPAIGN_TYPES.map((id) => (
              <option key={id} value={id}>
                {CAMPAIGN_TYPE_LABELS[id]}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-amber-950">
          Goal (PHP)
          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            required
            placeholder="e.g. 500,000"
            value={goalAmount}
            onChange={(e) => setGoalAmount(formatGoalAmountDisplay(e.target.value))}
            className="mt-1 w-full rounded-lg border border-amber-900/15 px-3 py-2 outline-none ring-teal-600/30 focus:ring-2"
          />
        </label>
        <label className="block text-sm font-medium text-amber-950">
          Recipient / fund name
          <input
            required
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-amber-900/15 px-3 py-2 outline-none ring-teal-600/30 focus:ring-2"
          />
        </label>
        <label className="block text-sm font-medium text-amber-950">
          Recipient note (shown to donors)
          <textarea
            required
            rows={3}
            value={recipientNote}
            onChange={(e) => setRecipientNote(e.target.value)}
            className="mt-1 w-full rounded-lg border border-amber-900/15 px-3 py-2 outline-none ring-teal-600/30 focus:ring-2"
          />
        </label>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-teal-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
        >
          {submitting ? 'Submitting…' : 'Submit for review'}
        </button>
      </form>
      <p className="mt-6 text-sm">
        <Link href="/campaigns/dashboard" className="text-teal-800 underline">
          My campaigns
        </Link>
      </p>
    </div>
  );
}
