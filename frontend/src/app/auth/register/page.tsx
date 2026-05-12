'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { getClientApiBase, useAuth } from '@/providers/auth-provider';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const u = await register(fullName, email, password);
      router.push(u.role === 'ADMIN' ? '/admin' : '/profile');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-14 sm:px-6">
      <h1 className="text-3xl font-bold text-amber-950">Create an account</h1>
      <p className="mt-2 text-sm text-amber-950/75">
        Regular accounts can post campaigns (pending review before they go live).
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-2xl border border-amber-900/10 bg-white p-6 shadow-sm">
        <label className="block text-sm font-medium text-amber-950">
          Full name
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
            className="mt-1 w-full rounded-lg border border-amber-900/15 px-3 py-2 outline-none ring-teal-600/30 focus:ring-2"
          />
        </label>
        <label className="block text-sm font-medium text-amber-950">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="mt-1 w-full rounded-lg border border-amber-900/15 px-3 py-2 outline-none ring-teal-600/30 focus:ring-2"
          />
        </label>
        <label className="block text-sm font-medium text-amber-950">
          Password (min 8 characters)
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            className="mt-1 w-full rounded-lg border border-amber-900/15 px-3 py-2 outline-none ring-teal-600/30 focus:ring-2"
          />
        </label>
        <label className="flex items-start gap-2 text-sm text-amber-950/85">
          <input type="checkbox" className="mt-1" required />
          <span>
            I agree to the{' '}
            <Link href="/terms" className="font-semibold text-teal-800 underline">
              terms &amp; fees
            </Link>
            .
          </span>
        </label>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-amber-950 py-2.5 text-sm font-semibold text-amber-50 hover:bg-amber-900 disabled:opacity-60"
        >
          {submitting ? 'Creating account…' : 'Register'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-amber-950/75">
        Already registered?{' '}
        <Link href="/auth/login" className="font-semibold text-teal-800 underline">
          Log in
        </Link>
      </p>
      <p className="mt-4 text-center text-xs text-amber-950/55">
        API: <span className="font-mono">{getClientApiBase() || 'not set'}</span>
      </p>
    </div>
  );
}
