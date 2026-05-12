'use client';

import { useEffect, useState } from 'react';

type Props = {
  images: string[];
  alt: string;
  aspectClass?: string;
  className?: string;
  emptyHint?: string;
};

export function CampaignImageCarousel({
  images,
  alt,
  aspectClass = 'aspect-[16/9]',
  className = 'rounded-xl',
  emptyHint = 'No images yet.',
}: Props) {
  const urls = images.filter(Boolean);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    setIdx(0);
  }, [urls.join('|')]);

  const n = urls.length;
  const safeIdx = n ? Math.min(idx, n - 1) : 0;
  const go = (delta: number) => {
    if (n < 2) return;
    setIdx((i) => (i + delta + n) % n);
  };

  if (n === 0) {
    return (
      <div
        className={`flex items-center justify-center border border-dashed border-amber-900/20 bg-amber-50/80 text-center ${aspectClass} ${className}`}
      >
        <p className="px-4 text-sm text-amber-950/65">{emptyHint}</p>
      </div>
    );
  }

  if (n === 1) {
    return (
      <div className={`relative overflow-hidden bg-amber-100 ${aspectClass} ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- remote campaign URLs */}
        <img src={urls[0]} alt={alt} className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-amber-100 ${aspectClass} ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={urls[safeIdx]} alt={alt} className="h-full w-full object-cover" />
      <button
        type="button"
        aria-label="Previous image"
        onClick={() => go(-1)}
        className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-amber-950/70 px-2.5 py-1.5 text-sm font-medium text-white shadow hover:bg-amber-950"
      >
        ‹
      </button>
      <button
        type="button"
        aria-label="Next image"
        onClick={() => go(1)}
        className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-amber-950/70 px-2.5 py-1.5 text-sm font-medium text-white shadow hover:bg-amber-950"
      >
        ›
      </button>
      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
        {urls.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Image ${i + 1} of ${n}`}
            aria-current={i === safeIdx ? 'true' : undefined}
            onClick={() => setIdx(i)}
            className={`h-2 rounded-full transition-all ${
              i === safeIdx ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
