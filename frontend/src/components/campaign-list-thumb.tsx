'use client';

import { ImageLightbox, useImageLightbox } from '@/components/image-lightbox';

type Props = {
  imageUrl: string;
  title: string;
  className?: string;
};

/** Small fixed thumbnail for campaign list rows. */
export function CampaignListThumb({ imageUrl, title, className = '' }: Props) {
  const { state, openAt, close, prev, next } = useImageLightbox();
  const trimmed = imageUrl?.trim();
  if (!trimmed) {
    return (
      <div
        className={`relative h-11 w-16 shrink-0 overflow-hidden rounded-md border border-amber-900/10 bg-amber-100 ring-1 ring-amber-900/5 ${className}`}
      />
    );
  }

  return (
    <>
      <div
        className={`relative h-11 w-16 shrink-0 overflow-hidden rounded-md border border-amber-900/10 bg-amber-100 ring-1 ring-amber-900/5 ${className}`}
      >
        <button
          type="button"
          title="View larger"
          aria-label={`View ${title} larger`}
          className="h-full w-full cursor-zoom-in border-0 bg-transparent p-0"
          onClick={() => openAt([trimmed], 0)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- remote campaign URLs */}
          <img src={trimmed} alt={title} className="pointer-events-none h-full w-full object-cover" />
        </button>
      </div>
      <ImageLightbox state={state} onClose={close} onPrev={prev} onNext={next} ariaLabel="Campaign photo" />
    </>
  );
}
