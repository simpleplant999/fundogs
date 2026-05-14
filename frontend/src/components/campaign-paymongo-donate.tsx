'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const PAYMONGO_API = 'https://api.paymongo.com/v1';

function basicAuth(key: string): string {
  return btoa(`${key}:`);
}

function parsePaymongoClientErrors(json: unknown): string {
  const err = json as { errors?: Array<{ detail?: string }> };
  const parts = err.errors?.map((e) => e.detail).filter((d): d is string => typeof d === 'string' && d.length > 0);
  if (parts?.length) return parts.join(' — ');
  return 'PayMongo request failed';
}

/** PayMongo expects string PAN/CVC and integer month/year; year is usually 4-digit (YY → 20YY). */
function buildPaymongoCardDetails(raw: {
  cardNumber: string;
  expMonthStr: string;
  expYearStr: string;
  cvcStr: string;
}): { card_number: string; exp_month: number; exp_year: number; cvc: string } {
  const card_number = String(raw.cardNumber ?? '').replace(/\D/g, '');
  if (card_number.length < 12 || card_number.length > 19) {
    throw new Error('Card number must be 12–19 digits.');
  }
  const exp_month = Math.trunc(Number.parseInt(String(raw.expMonthStr).trim(), 10));
  if (!Number.isFinite(exp_month) || exp_month < 1 || exp_month > 12) {
    throw new Error('Expiry month must be 01–12.');
  }
  const yrRaw = String(raw.expYearStr).trim();
  if (!yrRaw.length) {
    throw new Error('Enter expiry year (YY or YYYY).');
  }
  let exp_year: number;
  if (yrRaw.length <= 2) {
    const yy = Number.parseInt(yrRaw, 10);
    if (!Number.isFinite(yy) || yy < 0 || yy > 99) {
      throw new Error('Enter expiry year as YY (e.g. 34) or YYYY (e.g. 2034).');
    }
    exp_year = 2000 + yy;
  } else if (yrRaw.length === 4) {
    exp_year = Number.parseInt(yrRaw, 10);
  } else {
    throw new Error('Use a 2-digit year (e.g. 34) or 4-digit year (2034).');
  }
  if (!Number.isFinite(exp_year) || exp_year < 2000 || exp_year > 9999) {
    throw new Error('Expiry year must be between 2000 and 9999.');
  }
  const rawCvc = String(raw.cvcStr ?? '').trim();
  if (rawCvc.length > 0 && rawCvc.length < 3) {
    throw new Error('CVC must be at least 3 characters.');
  }
  const cvc = rawCvc.length >= 3 ? rawCvc : '123';
  return { card_number, exp_month, exp_year, cvc };
}

async function paymongoCreateCardPaymentMethod(
  publicKey: string,
  details: { card_number: string; exp_month: number; exp_year: number; cvc: string },
  billing: { name: string; email: string },
): Promise<string> {
  assertPaymongoPublishableKeyForBrowser(publicKey);
  const res = await fetch(`${PAYMONGO_API}/payment_methods`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${basicAuth(publicKey)}`,
    },
    body: JSON.stringify({
      data: {
        attributes: {
          type: 'card',
          details: {
            card_number: details.card_number,
            exp_month: details.exp_month,
            exp_year: details.exp_year,
            cvc: details.cvc,
          },
          billing: {
            name: billing.name.slice(0, 120),
            email: billing.email.trim().slice(0, 120),
            phone: '09171234567',
            address: {
              line1: 'Fundogs donor',
              city: 'Manila',
              state: 'Metro Manila',
              postal_code: '1000',
              country: 'PH',
            },
          },
        },
      },
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(parsePaymongoClientErrors(json));
  const id = (json as { data?: { id?: string } }).data?.id;
  if (!id) throw new Error('PayMongo did not return a card method id');
  return id;
}

/** Attach uses Basic auth with the publishable key; `client_key` goes in the JSON body (PayMongo OpenAPI). */
async function paymongoAttachPaymentMethod(
  publishableKey: string,
  clientKey: string,
  paymentIntentId: string,
  paymentMethodId: string,
): Promise<void> {
  assertPaymongoPublishableKeyForBrowser(publishableKey);
  const res = await fetch(
    `${PAYMONGO_API}/payment_intents/${encodeURIComponent(paymentIntentId)}/attach`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${basicAuth(publishableKey)}`,
      },
      body: JSON.stringify({
        data: {
          attributes: {
            payment_method: paymentMethodId,
            client_key: clientKey,
          },
        },
      }),
    },
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(parsePaymongoClientErrors(json));
}

const PAYMONGO_TEST_PK_PATTERN = /^pk_test/;

/** Publishable keys only — used for `POST /payment_methods` from the browser. */
const PAYMONGO_PUBLISHABLE_KEY_PATTERN = /^pk_(test|live)_/;

function paymongoKeyLooksLikeIntentClientKey(key: string): boolean {
  return /^pi_[a-zA-Z0-9]+_client_/i.test(key.trim());
}

function assertPaymongoPublishableKeyForBrowser(publicKey: string): void {
  const k = publicKey.trim();
  if (!k) {
    throw new Error('Missing NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY (use pk_test_… from the PayMongo Dashboard).');
  }
  if (paymongoKeyLooksLikeIntentClientKey(k)) {
    throw new Error(
      'Wrong key in NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY: that value is a PaymentIntent client_key (pi_…_client_…). Use your Publishable key instead (pk_test_… under Dashboard → Developers → API keys). The client_key is created per donation and must not go in .env.',
    );
  }
  if (/^sk_(test|live)_/i.test(k)) {
    throw new Error(
      'Do not put your Secret key (sk_…) in NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY — it would be exposed in the browser. Use only the Publishable key (pk_test_…).',
    );
  }
  if (!PAYMONGO_PUBLISHABLE_KEY_PATTERN.test(k)) {
    throw new Error(
      'NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY must be your publishable key (pk_test_… or pk_live_…). See https://developers.paymongo.com/docs/authentication',
    );
  }
}

type Props = {
  api: string;
  scope?: 'campaign' | 'platform';
  slug?: string;
  campaignTitle: string;
  campaignDescription?: string;
  sectionTitle?: string;
  sectionIntro?: string;
  successMessage?: string;
  onPaid?: (info: { amountAddedPhp: number }) => void;
};

type SyncPaymongoResponse = {
  recorded?: boolean;
  alreadyRecorded?: boolean;
  status?: string;
};

function parseApiError(data: unknown): string {
  if (!data || typeof data !== 'object') return 'Request failed';
  const d = data as { message?: string | string[] };
  if (Array.isArray(d.message)) return d.message.join(', ');
  if (typeof d.message === 'string') return d.message;
  return 'Request failed';
}

function isPaymongoPaid(data: SyncPaymongoResponse): boolean {
  const st = (data.status ?? '').toLowerCase();
  return Boolean(data.recorded || data.alreadyRecorded || st === 'succeeded');
}

/** PayMongo QR Ph (GCash, Maya, …) plus optional sandbox test card when `NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY` is `pk_test_`. */
export function CampaignPaymongoDonate({
  scope = 'campaign',
  slug,
  api,
  campaignTitle,
  campaignDescription,
  sectionTitle,
  sectionIntro,
  successMessage,
  onPaid,
}: Props) {
  const donationsPath =
    scope === 'platform'
      ? `${api}/support/donations`
      : `${api}/campaigns/${encodeURIComponent(slug ?? '')}/donations`;
  const paymongoPk = (process.env.NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY ?? '').trim();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [cardConfirming, setCardConfirming] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [paymongoFlow, setPaymongoFlow] = useState<null | 'qr' | 'card'>(null);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [piId, setPiId] = useState<string | null>(null);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpMM, setCardExpMM] = useState('');
  const [cardExpYY, setCardExpYY] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const piRef = useRef<string | null>(null);
  const amountRef = useRef(0);
  const paidNotifiedRef = useRef(false);
  piRef.current = piId;

  const finishPaid = useCallback(() => {
    if (!paidNotifiedRef.current) {
      paidNotifiedRef.current = true;
      const amt = amountRef.current;
      if (onPaid && Number.isFinite(amt) && amt >= 20) onPaid({ amountAddedPhp: amt });
    }
    setShowQr(false);
    setCardConfirming(false);
    setQrImageUrl(null);
    setPiId(null);
    piRef.current = null;
    setShowSuccess(true);
  }, [onPaid]);

  const pollOnce = useCallback(async () => {
    const id = piRef.current;
    if (!id) return;
    try {
      const res = await fetch(`${donationsPath}/sync-paymongo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentIntentId: id }),
      });
      const data = (await res.json().catch(() => ({}))) as SyncPaymongoResponse;
      if (!res.ok) return;
      if (isPaymongoPaid(data)) finishPaid();
    } catch {
      /* ignore */
    }
  }, [api, slug, finishPaid]);

  useEffect(() => {
    const polling = (showQr && Boolean(qrImageUrl)) || cardConfirming;
    if (!polling || !piId) return;
    void pollOnce();
    const handle = setInterval(() => void pollOnce(), 2000);
    return () => clearInterval(handle);
  }, [showQr, qrImageUrl, piId, cardConfirming, pollOnce]);

  function resetForAnotherDonation() {
    paidNotifiedRef.current = false;
    setShowSuccess(false);
    setErr(null);
    setCardConfirming(false);
    setPaymongoFlow(null);
  }

  async function startQr() {
    setErr(null);
    const amt = Number(amount);
    const nm = name.trim();
    if (!nm) {
      setErr('Enter the name to show with your gift.');
      setPaymongoFlow(null);
      return;
    }
    if (!Number.isFinite(amt) || amt < 20) {
      setErr('Enter amount PHP 20 or more (PayMongo QR Ph minimum).');
      setPaymongoFlow(null);
      return;
    }
    amountRef.current = amt;
    paidNotifiedRef.current = false;
    setBusy(true);
    try {
      const body: Record<string, unknown> = { donorDisplayName: nm, amount: amt };
      if (email.trim()) body.billingEmail = email.trim();
      if (phone.trim()) body.billingPhone = phone.trim();
      const res = await fetch(`${donationsPath}/paymongo-qr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as {
        qrImageUrl?: string;
        paymentIntentId?: string;
        message?: string | string[];
      };
      if (!res.ok) {
        setErr(parseApiError(data));
        setPaymongoFlow(null);
        return;
      }
      if (!data.qrImageUrl || !data.paymentIntentId) {
        setErr('PayMongo did not return QR data.');
        setPaymongoFlow(null);
        return;
      }
      setShowSuccess(false);
      setQrImageUrl(data.qrImageUrl);
      setPiId(data.paymentIntentId);
      setShowQr(true);
    } finally {
      setBusy(false);
    }
  }

  async function donateWithCard() {
    setErr(null);
    const amt = Number(amount);
    const nm = name.trim();
    if (!nm) {
      setErr('Enter the name to show with your gift.');
      return;
    }
    if (!Number.isFinite(amt) || amt < 20) {
      setErr('Enter amount PHP 20 or more.');
      return;
    }
    let cardDetails: ReturnType<typeof buildPaymongoCardDetails>;
    try {
      cardDetails = buildPaymongoCardDetails({
        cardNumber,
        expMonthStr: cardExpMM,
        expYearStr: cardExpYY,
        cvcStr: cardCvc,
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Invalid card details');
      return;
    }
    amountRef.current = amt;
    paidNotifiedRef.current = false;
    setBusy(true);
    try {
      const body: Record<string, unknown> = { donorDisplayName: nm, amount: amt };
      if (email.trim()) body.billingEmail = email.trim();
      if (phone.trim()) body.billingPhone = phone.trim();
      const res = await fetch(`${donationsPath}/paymongo-card`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as {
        paymentIntentId?: string;
        clientKey?: string;
        message?: string | string[];
      };
      if (!res.ok) {
        setErr(parseApiError(data));
        return;
      }
      if (!data.paymentIntentId || !data.clientKey) {
        setErr('PayMongo did not return card checkout data.');
        return;
      }
      const billingEmail =
        email.trim() || `donors+${encodeURIComponent(slug ?? 'platform').slice(0, 48)}@example.com`;
      const pmId = await paymongoCreateCardPaymentMethod(paymongoPk, cardDetails, {
        name: nm,
        email: billingEmail,
      });
      await paymongoAttachPaymentMethod(paymongoPk, data.clientKey, data.paymentIntentId, pmId);
      setShowSuccess(false);
      setShowQr(false);
      setQrImageUrl(null);
      setPiId(data.paymentIntentId);
      piRef.current = data.paymentIntentId;
      setCardConfirming(true);
      void pollOnce();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Card donation failed');
    } finally {
      setBusy(false);
    }
  }

  if (showSuccess) {
    return (
      <div className="rounded-xl border border-teal-600/25 bg-teal-50/80 p-5">
        <p className="text-base font-semibold text-teal-950">Thank you!</p>
        <p className="mt-2 text-sm text-teal-900/90">
          {successMessage ??
            'PayMongo received your donation. Your gift should appear in the totals and donor list shortly.'}
        </p>
        <button
          type="button"
          onClick={resetForAnotherDonation}
          className="mt-5 w-full rounded-full bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
        >
          Donate again
        </button>
      </div>
    );
  }

  if (cardConfirming && piId) {
    return (
      <div className="rounded-xl border border-teal-600/20 bg-teal-50/50 p-4">
        <p className="text-sm font-medium text-teal-950">Confirming test card donation…</p>
        <p className="mt-1 text-xs text-teal-900/75">
          PayMongo is finalizing your donation. This usually takes a few seconds.
        </p>
        <button
          type="button"
          className="mt-4 w-full rounded-full px-4 py-2 text-sm text-teal-950 ring-1 ring-teal-700/25 hover:bg-teal-100/60"
          onClick={() => {
            setCardConfirming(false);
            setPiId(null);
            piRef.current = null;
            paidNotifiedRef.current = false;
            setPaymongoFlow(null);
          }}
        >
          Cancel
        </button>
      </div>
    );
  }

  if (showQr && qrImageUrl) {
    return (
      <div className="rounded-xl border border-amber-900/10 bg-amber-50/40 p-4">
        <p className="text-sm font-medium text-amber-950">Scan with your bank or e-wallet (QR Ph)</p>
        <p className="mt-1 text-xs text-amber-950/70">
          This screen will switch to a thank-you message as soon as your donation is confirmed.
        </p>
        <img
          src={qrImageUrl}
          alt="QR Ph donation code"
          className="mx-auto mt-4 max-w-[280px] rounded-lg border border-amber-900/10 bg-white p-2"
        />
        <button
          type="button"
          className="mt-4 w-full rounded-full px-4 py-2 text-sm text-amber-950 ring-1 ring-amber-900/20 hover:bg-amber-100/50"
          onClick={() => {
            setShowQr(false);
            setQrImageUrl(null);
            setPiId(null);
            piRef.current = null;
            paidNotifiedRef.current = false;
            setPaymongoFlow(null);
          }}
        >
          Cancel
        </button>
      </div>
    );
  }

  const parsedAmount = Number(amount);
  const canChooseDonationMethod =
    name.trim().length > 0 && Number.isFinite(parsedAmount) && parsedAmount >= 20;

  return (
    <section className="rounded-2xl border border-amber-900/10 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-amber-950">{sectionTitle ?? 'Donate with PayMongo'}</h2>
      <p className="mt-1 text-xs text-amber-950/65">
        {sectionIntro ??
          'Enter your details, then choose how to donate: QR Ph or a card. Minimum PHP 20.'}
      </p>

      <div className="mt-3 space-y-2">
        <label className="block text-sm font-medium text-amber-950">
          Name (shown publicly)
          <span className="text-rose-700" aria-hidden="true">
            {' '}
            *
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={120}
            disabled={busy}
            required
            aria-required="true"
            className="mt-1 w-full rounded-lg border border-amber-900/15 px-3 py-2 text-sm outline-none ring-teal-600/30 focus:ring-2 disabled:bg-amber-50/80"
            placeholder="e.g. Alex M."
          />
        </label>
        <label className="block text-sm font-medium text-amber-950">
          Amount (PHP, min 20)
          <span className="text-rose-700" aria-hidden="true">
            {' '}
            *
          </span>
          <input
            type="number"
            min={20}
            step={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={busy}
            required
            aria-required="true"
            className="mt-1 w-full rounded-lg border border-amber-900/15 px-3 py-2 text-sm outline-none ring-teal-600/30 focus:ring-2 disabled:bg-amber-50/80"
            placeholder="500"
          />
        </label>
        <label className="hidden text-sm font-medium text-amber-950">
          Billing email (optional)
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
        </label>
        <label className="hidden text-sm font-medium text-amber-950">
          Mobile (optional)
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
        </label>
      </div>
      {err ? <p className="mt-2 text-sm text-red-700">{err}</p> : null}

      {paymongoFlow === null ? (
        <div className="mt-5">
          <p className="text-sm font-medium text-amber-950">How would you like to donate?</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              disabled={busy || !canChooseDonationMethod}
              onClick={() => {
                setErr(null);
                setPaymongoFlow('qr');
                void startQr();
              }}
              className="flex flex-col items-start rounded-xl border border-amber-900/15 bg-amber-50/50 px-4 py-3 text-left transition hover:border-amber-900/30 hover:bg-amber-50 disabled:opacity-60"
            >
              <span className="text-sm font-semibold text-amber-950">QR Ph</span>
              <span className="mt-1 text-xs text-amber-950/70">GCash, Maya, and other QR Ph apps</span>
            </button>
            <button
                type="button"
                disabled={busy || !canChooseDonationMethod}
                onClick={() => {
                  setErr(null);
                  setPaymongoFlow('card');
                }}
                className="flex flex-col items-start rounded-xl border border-teal-700/25 bg-teal-50/50 px-4 py-3 text-left transition hover:border-teal-700/40 hover:bg-teal-50/80 disabled:opacity-60"
              >
                <span className="text-sm font-semibold text-teal-950">Card</span>
                <span className="mt-1 text-xs text-teal-950/70">Pay with debit or credit card</span>
              </button>
          </div>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setErr(null);
              setPaymongoFlow(null);
            }}
            className="text-sm font-medium text-teal-800 underline-offset-2 hover:underline disabled:opacity-50"
          >
            ← Change donation method
          </button>

          {paymongoFlow === 'qr' ? (
            <div className="rounded-xl border border-amber-900/10 bg-amber-50/40 p-4">
              <p className="text-sm font-medium text-amber-950">Scan with your bank or e-wallet (QR Ph)</p>
              <p className="mt-1 text-xs text-amber-950/70">
                {busy
                  ? 'Creating your QR code…'
                  : 'This screen will switch to a thank-you message as soon as your donation is confirmed.'}
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-teal-700/20 bg-teal-50/35 p-4">
              <h3 className="text-sm font-semibold text-teal-950">Card</h3>
              <p className="mt-2 text-sm font-medium text-teal-950">{campaignTitle}</p>
              {campaignDescription?.trim() ? (
                <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-teal-900/75">
                  {campaignDescription.trim()}
                </p>
              ) : null}
              <p className="mt-3 text-xs text-teal-900/70">
                Your card statement may show a donation for this campaign.
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <label className="block text-sm font-medium text-teal-950 sm:col-span-2">
                  Card number
                  <input
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    disabled={busy}
                    autoComplete="cc-number"
                    inputMode="numeric"
                    placeholder="4343 4343 4343 4345"
                    className="mt-1 w-full rounded-lg border border-teal-800/15 bg-white px-3 py-2 font-mono text-sm outline-none ring-teal-600/30 focus:ring-2 disabled:bg-teal-50/50"
                  />
                </label>
                <label className="block text-sm font-medium text-teal-950">
                  Expiry (MM)
                  <input
                    value={cardExpMM}
                    onChange={(e) => setCardExpMM(e.target.value)}
                    disabled={busy}
                    maxLength={2}
                    inputMode="numeric"
                    placeholder="12"
                    className="mt-1 w-full rounded-lg border border-teal-800/15 bg-white px-3 py-2 font-mono text-sm outline-none ring-teal-600/30 focus:ring-2 disabled:bg-teal-50/50"
                  />
                </label>
                <label className="block text-sm font-medium text-teal-950">
                  Year (YY or YYYY)
                  <input
                    value={cardExpYY}
                    onChange={(e) => setCardExpYY(e.target.value)}
                    disabled={busy}
                    maxLength={4}
                    inputMode="numeric"
                    placeholder="34"
                    className="mt-1 w-full rounded-lg border border-teal-800/15 bg-white px-3 py-2 font-mono text-sm outline-none ring-teal-600/30 focus:ring-2 disabled:bg-teal-50/50"
                  />
                </label>
                <label className="block text-sm font-medium text-teal-950 sm:col-span-2">
                  CVC
                  <input
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                    disabled={busy}
                    maxLength={4}
                    autoComplete="cc-csc"
                    inputMode="numeric"
                    placeholder="123"
                    className="mt-1 w-full rounded-lg border border-teal-800/15 bg-white px-3 py-2 font-mono text-sm outline-none ring-teal-600/30 focus:ring-2 disabled:bg-teal-50/50"
                  />
                </label>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => void donateWithCard()}
                className="mt-4 w-full rounded-full bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
              >
                {busy ? 'Processing…' : 'Donate with card'}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
