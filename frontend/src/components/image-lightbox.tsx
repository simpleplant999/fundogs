'use client';

import { useCallback, useEffect, useState } from 'react';

export type ImageLightboxState = { urls: string[]; index: number };

export function useImageLightbox() {
  const [state, setState] = useState<ImageLightboxState | null>(null);
  const openAt = useCallback((urls: string[], index: number) => {
    const u = urls.filter(Boolean);
    if (!u.length) return;
    const i = Math.min(Math.max(0, index), u.length - 1);
    setState({ urls: u, index: i });
  }, []);
  const close = useCallback(() => setState(null), []);
  const prev = useCallback(
    () => setState((s) => (s && s.index > 0 ? { urls: s.urls, index: s.index - 1 } : s)),
    [],
  );
  const next = useCallback(
    () => setState((s) => (s && s.index < s.urls.length - 1 ? { urls: s.urls, index: s.index + 1 } : s)),
    [],
  );
  return { state, openAt, close, prev, next };
}

type ImageLightboxProps = {
  state: ImageLightboxState | null;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  /** `aria-label` on the dialog surface */
  ariaLabel?: string;
};

export function ImageLightbox({
  state,
  onClose,
  onPrev,
  onNext,
  ariaLabel = 'Enlarged photo',
}: ImageLightboxProps) {
  const src = state ? state.urls[state.index] : '';
  const hasPrev = state ? state.index > 0 : false;
  const hasNext = state ? state.index < state.urls.length - 1 : false;

  useEffect(() => {
    if (!state) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'ArrowLeft' && state.index > 0) {
        e.preventDefault();
        onPrev();
        return;
      }
      if (e.key === 'ArrowRight' && state.index < state.urls.length - 1) {
        e.preventDefault();
        onNext();
      }
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [state, onClose, onPrev, onNext]);

  if (!state || !src) return null;

  const n = state.urls.length;
  /** Square viewport: width = height; capped so header + frame fit on short screens. */
  const frameSize = 'w-[min(92vw,min(80vh,900px))]';

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      onClick={onClose}
    >
      <div
        className="relative flex max-h-full max-w-full flex-col items-center gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`flex ${frameSize} shrink-0 items-center justify-between gap-2 text-white/90`}
        >
          <p className="min-w-0 truncate text-xs font-medium tabular-nums sm:text-sm">
            {n > 1 ? `${state.index + 1} / ${n}` : 'Photo'}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold hover:bg-white/25"
          >
            Close
          </button>
        </div>

        <div
          className={`relative aspect-square ${frameSize} shrink-0 overflow-hidden rounded-lg bg-black/25 shadow-2xl ring-1 ring-white/20`}
        >
          {n > 1 ? (
            <button
              type="button"
              aria-label="Previous image"
              disabled={!hasPrev}
              onClick={(e) => {
                e.stopPropagation();
                onPrev();
              }}
              className="absolute left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-amber-950/85 text-2xl font-bold leading-none text-white shadow-lg backdrop-blur-sm transition hover:bg-amber-950 disabled:pointer-events-none disabled:opacity-25 sm:left-3 sm:h-12 sm:w-12 sm:text-3xl"
            >
              ‹
            </button>
          ) : null}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" className="h-full w-full object-contain" />
          {n > 1 ? (
            <button
              type="button"
              aria-label="Next image"
              disabled={!hasNext}
              onClick={(e) => {
                e.stopPropagation();
                onNext();
              }}
              className="absolute right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-amber-950/85 text-2xl font-bold leading-none text-white shadow-lg backdrop-blur-sm transition hover:bg-amber-950 disabled:pointer-events-none disabled:opacity-25 sm:right-3 sm:h-12 sm:w-12 sm:text-3xl"
            >
              ›
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
