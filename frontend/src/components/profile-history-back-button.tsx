'use client';

import { useRouter } from 'next/navigation';

const btnClass =
  'font-medium text-teal-800 underline decoration-teal-800/40 underline-offset-2 hover:decoration-teal-800';

/** Uses browser history when no explicit return path was provided. */
export function ProfileHistoryBackButton() {
  const router = useRouter();
  return (
    <button type="button" className={btnClass} onClick={() => router.back()}>
      Back
    </button>
  );
}
