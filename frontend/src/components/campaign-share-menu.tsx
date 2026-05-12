'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';

type Props = {
  slug: string;
  title: string;
};

export function CampaignShareMenu({ slug, title }: Props) {
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const [pageUrl, setPageUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPageUrl(`${window.location.origin}/campaigns/${encodeURIComponent(slug)}`);
  }, [slug]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const shareText = `Support this campaign: ${title}`;

  const shareNative = useCallback(async () => {
    if (!pageUrl) return;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, text: shareText, url: pageUrl });
        setOpen(false);
      } catch {
        /* user cancelled */
      }
    }
  }, [pageUrl, title, shareText]);

  const openFacebook = useCallback(() => {
    if (!pageUrl) return;
    const u = encodeURIComponent(pageUrl);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${u}`, '_blank', 'noopener,noreferrer');
    setOpen(false);
  }, [pageUrl]);

  const openX = useCallback(() => {
    if (!pageUrl) return;
    const u = encodeURIComponent(pageUrl);
    const t = encodeURIComponent(shareText);
    window.open(`https://twitter.com/intent/tweet?url=${u}&text=${t}`, '_blank', 'noopener,noreferrer');
    setOpen(false);
  }, [pageUrl, shareText]);

  const openLinkedIn = useCallback(() => {
    if (!pageUrl) return;
    const u = encodeURIComponent(pageUrl);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${u}`, '_blank', 'noopener,noreferrer');
    setOpen(false);
  }, [pageUrl]);

  const copyLink = useCallback(async () => {
    if (!pageUrl) return;
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setOpen(false);
    } catch {
      /* ignore */
    }
  }, [pageUrl]);

  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <div ref={wrapRef} className="relative shrink-0">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={menuId}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-full border border-amber-900/15 bg-white px-4 py-2 text-sm font-medium text-amber-950 shadow-sm ring-teal-600/20 transition hover:bg-amber-50 hover:ring-2"
      >
        <span aria-hidden>↗</span>
        Share
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 z-20 mt-2 min-w-[200px] rounded-xl border border-amber-900/15 bg-white py-1 shadow-lg ring-1 ring-amber-900/10"
        >
          {canNativeShare ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => void shareNative()}
              className="flex w-full px-4 py-2.5 text-left text-sm text-amber-950 hover:bg-amber-50"
            >
              Share via device…
            </button>
          ) : null}
          <button
            type="button"
            role="menuitem"
            onClick={openFacebook}
            className="flex w-full px-4 py-2.5 text-left text-sm text-amber-950 hover:bg-amber-50"
          >
            Facebook
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={openX}
            className="flex w-full px-4 py-2.5 text-left text-sm text-amber-950 hover:bg-amber-50"
          >
            X (Twitter)
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={openLinkedIn}
            className="flex w-full px-4 py-2.5 text-left text-sm text-amber-950 hover:bg-amber-50"
          >
            LinkedIn
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => void copyLink()}
            className="flex w-full px-4 py-2.5 text-left text-sm text-amber-950 hover:bg-amber-50"
          >
            {copied ? 'Copied!' : 'Copy link'}
          </button>
        </div>
      ) : null}
    </div>
  );
}
