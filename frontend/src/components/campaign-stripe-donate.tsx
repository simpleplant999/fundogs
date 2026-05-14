'use client';

import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import type { StripeElementsOptions } from '@stripe/stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { donorDisplayNameFromFullName, isDonorDisplayNameReady, resolveDonorDisplayName } from '@/lib/donor-display-name';
import { useAuth } from '@/providers/auth-provider';
import { ToggleSwitch } from '@/components/toggle-switch';

type Props = {
  slug: string;
  api: string;
  /** Called after an embedded payment succeeds; include amount so the campaign page can update raised immediately. */
  onSuccess: (info?: { amountAddedPhp: number }) => void;
};

function parseApiError(data: unknown): string {
  if (!data || typeof data !== 'object') return 'Request failed';
  const d = data as { message?: string | string[] };
  if (Array.isArray(d.message)) return d.message.join(', ');
  if (typeof d.message === 'string') return d.message;
  return 'Request failed';
}

function EmbeddedPayForm({
  slug,
  onPaid,
  onBack,
}: {
  slug: string;
  onPaid: () => void;
  onBack: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [localErr, setLocalErr] = useState<string | null>(null);

  const submit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!stripe || !elements) {
        setLocalErr('Payment form is still loading. Please wait a moment and try again.');
        return;
      }
      setLocalErr(null);
      setBusy(true);
      try {
        const { error: submitError } = await elements.submit();
        if (submitError) {
          setLocalErr(submitError.message ?? 'Check your payment details.');
          return;
        }
        const { error, paymentIntent } = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: `${window.location.origin}/campaigns/${encodeURIComponent(slug)}?donated=stripe`,
          },
          redirect: 'if_required',
        });
        if (error) {
          setLocalErr(error.message ?? 'Payment failed');
          return;
        }
        if (paymentIntent?.status === 'succeeded') {
          onPaid();
        } else if (paymentIntent && !error) {
          setLocalErr(
            `Payment status: ${paymentIntent.status}. If you were charged, refresh the page in a moment.`,
          );
        }
      } finally {
        setBusy(false);
      }
    },
    [stripe, elements, slug, onPaid],
  );

  return (
    <form onSubmit={(e) => void submit(e)} className="space-y-4">
      <PaymentElement />
      {localErr ? <p className="text-sm text-red-700">{localErr}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onBack}
          disabled={busy}
          className="rounded-full px-4 py-2 text-sm font-medium text-amber-950 ring-1 ring-amber-900/20 hover:bg-amber-50 disabled:opacity-50"
        >
          Change amount
        </button>
        <button
          type="submit"
          disabled={busy || !stripe}
          className="rounded-full bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
        >
          {busy ? 'Processing…' : 'Pay now'}
        </button>
      </div>
    </form>
  );
}

export function CampaignStripeDonate({ slug, api, onSuccess }: Props) {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? '';
  const stripePromise = useMemo(
    () => (publishableKey ? loadStripe(publishableKey) : null),
    [publishableKey],
  );

  const { user, loading: authLoading } = useAuth();
  const [name, setName] = useState('');
  const [donateAnonymously, setDonateAnonymously] = useState(false);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || donateAnonymously) return;
    const fromProfile = user?.fullName ? donorDisplayNameFromFullName(user.fullName) : '';
    if (!fromProfile) return;
    setName((current) => (current.trim() ? current : fromProfile));
  }, [authLoading, user?.fullName, donateAnonymously]);

  const elementsOptions: StripeElementsOptions | undefined = clientSecret
    ? {
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#0f766e',
            borderRadius: '10px',
          },
        },
      }
    : undefined;

  async function createPaymentIntent() {
    setError(null);
    const amt = Number(amount);
    if (!isDonorDisplayNameReady(name, donateAnonymously)) {
      setError('Enter the name to show with your gift.');
      return;
    }
    if (!Number.isFinite(amt) || amt < 1) {
      setError('Enter a valid amount (PHP, at least 1).');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`${api}/campaigns/${encodeURIComponent(slug)}/donations/payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donorDisplayName: resolveDonorDisplayName(name, donateAnonymously),
          amount: amt,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { clientSecret?: string };
      if (!res.ok) {
        setError(
          res.status === 503
            ? 'Card donations are not available yet. Please try again later.'
            : parseApiError(data),
        );
        return;
      }
      if (!data.clientSecret) {
        setError('Could not start card form.');
        return;
      }
      setClientSecret(data.clientSecret);
    } finally {
      setBusy(false);
    }
  }

  async function startCheckoutRedirect() {
    setError(null);
    const amt = Number(amount);
    if (!isDonorDisplayNameReady(name, donateAnonymously)) {
      setError('Enter the name to show with your gift.');
      return;
    }
    if (!Number.isFinite(amt) || amt < 1) {
      setError('Enter a valid amount (PHP, at least 1).');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`${api}/campaigns/${encodeURIComponent(slug)}/donations/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donorDisplayName: resolveDonorDisplayName(name, donateAnonymously),
          amount: amt,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { url?: string };
      if (!res.ok) {
        setError(
          res.status === 503
            ? 'Card donations are not available yet. Please try again later.'
            : parseApiError(data),
        );
        return;
      }
      if (!data.url) {
        setError('Checkout did not return a URL.');
        return;
      }
      window.location.assign(data.url);
    } finally {
      setBusy(false);
    }
  }

  const handlePaid = useCallback(() => {
    const amt = Number(amount);
    if (Number.isFinite(amt) && amt >= 1) {
      onSuccess({ amountAddedPhp: amt });
    } else {
      onSuccess();
    }
    setClientSecret(null);
  }, [onSuccess, amount]);

  return (
    <section className="rounded-2xl border border-amber-900/10 bg-white p-5 shadow-sm hidden">
      <h2 className="text-lg font-bold text-amber-950">Donate with card</h2>
      <p className="mt-1 text-xs text-amber-950/65">
        Pay on this page with Stripe (fast), or open Stripe&apos;s full checkout page if you prefer. Verified gifts
        show under recent donors after payment completes.
      </p>

      <div className="mt-4 space-y-3">
        <ToggleSwitch
          id="stripe-donate-anonymously"
          label="Donate anonymously"
          description="Your gift will appear as Anonymous on the donor list."
          checked={donateAnonymously}
          onCheckedChange={setDonateAnonymously}
          disabled={!!clientSecret || busy}
        />
        {!donateAnonymously ? (
          <label className="block text-sm font-medium text-amber-950">
            Name (shown publicly)
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={120}
              disabled={!!clientSecret}
              className="mt-1 w-full rounded-lg border border-amber-900/15 px-3 py-2 text-sm outline-none ring-teal-600/30 focus:ring-2 disabled:bg-amber-50/80"
              placeholder="e.g. Alex M."
            />
          </label>
        ) : null}
        <label className="block text-sm font-medium text-amber-950">
          Amount (PHP)
          <input
            type="number"
            min={1}
            step={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={!!clientSecret}
            className="mt-1 w-full rounded-lg border border-amber-900/15 px-3 py-2 text-sm outline-none ring-teal-600/30 focus:ring-2 disabled:bg-amber-50/80"
            placeholder="500"
          />
        </label>
      </div>

      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}

      {clientSecret && stripePromise && elementsOptions ? (
        <div className="mt-5 rounded-xl border border-amber-900/10 bg-amber-50/30 p-4">
          <Elements stripe={stripePromise} options={elementsOptions} key={clientSecret}>
            <EmbeddedPayForm
              slug={slug}
              onPaid={handlePaid}
              onBack={() => {
                setClientSecret(null);
                setError(null);
              }}
            />
          </Elements>
        </div>
      ) : publishableKey && stripePromise ? (
        <div className="mt-4">
          <button
            type="button"
            disabled={busy}
            onClick={() => void createPaymentIntent()}
            className="w-full rounded-full bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
          >
            {busy ? 'Preparing card form…' : 'Enter card details here'}
          </button>
          <p className="mt-2 text-center text-xs text-amber-950/55">No redirect until your bank requires extra verification.</p>
        </div>
      ) : (
        <p className="mt-3 text-xs text-amber-950/70">
          Add <span className="font-mono">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</span> to your frontend env to pay on this
          page. You can still use hosted checkout below.
        </p>
      )}

      <div className="mt-6 border-t border-amber-900/10 pt-4 hidden">
        <p className="text-xs font-medium text-amber-950/70">Prefer Stripe&apos;s hosted payment page?</p>
        <button
          type="button"
          disabled={busy}
          onClick={() => void startCheckoutRedirect()}
          className="mt-2 w-full rounded-full bg-amber-950/10 px-4 py-2 text-sm font-medium text-amber-950 ring-1 ring-amber-900/15 hover:bg-amber-950/15 disabled:opacity-60"
        >
          {busy ? 'Please wait…' : 'Open Stripe Checkout in a new page'}
        </button>
      </div>
    </section>
  );
}
