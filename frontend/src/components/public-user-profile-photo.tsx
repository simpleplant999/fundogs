'use client';

import { ImageLightbox, useImageLightbox } from '@/components/image-lightbox';

export function PublicUserProfilePhoto({
  photoUrl,
  fallbackInitial,
}: {
  photoUrl: string | null;
  fallbackInitial: string;
}) {
  const { state, openAt, close, prev, next } = useImageLightbox();

  return (
    <>
      <div className="mx-auto h-28 w-28 overflow-hidden rounded-full border-2 border-amber-900/10 bg-amber-50">
        {photoUrl ? (
          <button
            type="button"
            title="View larger"
            className="h-full w-full cursor-zoom-in border-0 bg-transparent p-0"
            onClick={() => openAt([photoUrl], 0)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoUrl} alt="" className="pointer-events-none h-full w-full object-cover" />
          </button>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-amber-950/35">
            {fallbackInitial}
          </div>
        )}
      </div>
      <ImageLightbox state={state} onClose={close} onPrev={prev} onNext={next} ariaLabel="Profile photo" />
    </>
  );
}
