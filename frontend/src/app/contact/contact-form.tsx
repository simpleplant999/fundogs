'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { normalizeApiBaseUrl } from '@/lib/api-base';
import { useAuth } from '@/providers/auth-provider';

const CATEGORIES = [
  {
    value: 'REPORT_PROBLEM' as const,
    label: 'Report a problem',
    hint: 'Fraud, policy violations, payments or withdrawals on the platform, harassment.',
  },
  {
    value: 'GENERAL_QUESTION' as const,
    label: 'General question',
    hint: 'Verification, campaigns, organizations, or how FunDogs works.',
  },
];

async function readSubmitError(res: Response): Promise<string> {
  try {
    const data: unknown = await res.json();
    if (data && typeof data === 'object' && 'message' in data) {
      const m = (data as { message: unknown }).message;
      if (typeof m === 'string') return m;
      if (Array.isArray(m)) return m.map(String).join(' ');
    }
  } catch {
    /* ignore */
  }
  return `Something went wrong (${res.status}). Try again in a moment.`;
}

export function ContactForm() {
  const { user, loading: authLoading } = useAuth();
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]['value']>('REPORT_PROBLEM');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName((n) => (n.trim() ? n : user.fullName));
    setEmail((e) => (e.trim() ? e : user.email));
  }, [user?.id, user?.fullName, user?.email]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const base = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL ?? '');
    if (!base) {
      setError('This site is missing NEXT_PUBLIC_API_URL, so messages cannot be sent yet.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${base}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          category,
          message: message.trim(),
        }),
      });
      if (!res.ok) {
        setError(await readSubmitError(res));
        return;
      }
      setDone(true);
      setMessage('');
    } catch {
      setError('Network error. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-teal-800/20 bg-teal-50/60 p-6 shadow-sm">
        <p className="text-lg font-semibold text-teal-950">Message received</p>
        <p className="mt-2 text-sm leading-relaxed text-amber-950/85">
          Thanks for reaching out. We review submissions in order and will reply by email when we have an
          update.
        </p>
        <button
          type="button"
          className="mt-5 text-sm font-semibold text-teal-800 underline-offset-4 hover:underline"
          onClick={() => {
            setDone(false);
            setError(null);
          }}
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-amber-900/10 bg-white p-6 shadow-sm sm:p-8"
    >
      <h2 className="text-xl font-bold text-amber-950">Send us a message</h2>
      <p className="mt-2 text-sm leading-relaxed text-amber-950/80">
        Include links (for example a campaign URL) and any reference numbers so we can help quickly. For
        how verification works, see{' '}
        <Link href="/validation" className="font-semibold text-teal-800 underline-offset-2 hover:underline">
          this page
        </Link>
        .
      </p>

      <fieldset className="mt-6 space-y-3">
        <legend className="text-sm font-medium text-amber-950">Topic</legend>
        {CATEGORIES.map((opt) => (
          <label
            key={opt.value}
            className={`flex cursor-pointer gap-3 rounded-xl border px-4 py-3 transition ${
              category === opt.value
                ? 'border-teal-700 bg-teal-50/50 ring-1 ring-teal-700/25'
                : 'border-amber-900/10 hover:border-amber-900/20'
            }`}
          >
            <input
              type="radio"
              name="category"
              value={opt.value}
              checked={category === opt.value}
              onChange={() => setCategory(opt.value)}
              className="mt-1"
            />
            <span>
              <span className="block font-semibold text-amber-950">{opt.label}</span>
              <span className="mt-0.5 block text-xs text-amber-950/75">{opt.hint}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <label className="block text-sm font-medium text-amber-950 sm:col-span-1">
          Your name
          <input
            type="text"
            name="name"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={authLoading}
            className="mt-1 w-full rounded-lg border border-amber-900/15 px-3 py-2 outline-none ring-teal-600/30 focus:ring-2"
          />
        </label>
        <label className="block text-sm font-medium text-amber-950 sm:col-span-1">
          Email
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={authLoading}
            className="mt-1 w-full rounded-lg border border-amber-900/15 px-3 py-2 outline-none ring-teal-600/30 focus:ring-2"
          />
        </label>
      </div>

      <label className="mt-5 block text-sm font-medium text-amber-950">
        Message
        <textarea
          name="message"
          required
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          minLength={10}
          maxLength={8000}
          placeholder="Describe what happened, what you expected, and any URLs we should look at."
          className="mt-1 w-full resize-y rounded-lg border border-amber-900/15 px-3 py-2 outline-none ring-teal-600/30 focus:ring-2"
        />
        <span className="mt-1 block text-xs text-amber-950/60">{message.length} / 8000 characters</span>
      </label>

      {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}

      <button
        type="submit"
        disabled={submitting}
        className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-teal-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 disabled:opacity-60 sm:w-auto"
      >
        {submitting ? 'Sending…' : 'Send message'}
      </button>
    </form>
  );
}
