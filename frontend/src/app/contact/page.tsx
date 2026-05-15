import type { Metadata } from 'next';
import Link from 'next/link';
import { ContactForm } from './contact-form';

export const metadata: Metadata = {
  title: 'Contact us',
  description:
    'Reach FunDogs for general questions or to report a problem with the platform, a campaign, or an account.',
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-amber-950">Contact us</h1>
      <p className="mt-3 text-lg leading-relaxed text-amber-950/85">
        We read every message about safety, bugs, and account access. Your note is saved securely on our
        systems—no mail app required.
      </p>

      <div className="mt-10">
        <ContactForm />
      </div>

      <div className="mt-8 rounded-2xl border border-amber-900/10 bg-amber-50/50 p-6">
        <h2 className="text-lg font-bold text-amber-950">Support the platform</h2>
        <p className="mt-2 text-sm leading-relaxed text-amber-950/80">
          Want to give to FunDogs itself (separate from animal campaigns)? Visit our support page.
        </p>
        <Link
          href="/support"
          className="mt-4 inline-block text-sm font-semibold text-teal-800 underline-offset-4 hover:underline"
        >
          Support FunDogs →
        </Link>
      </div>
    </div>
  );
}
