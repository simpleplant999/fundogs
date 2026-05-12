'use client';

import { useRef, useState } from 'react';
import { CampaignImageCarousel } from '@/components/campaign-image-carousel';
import { uploadCampaignImages } from '@/lib/campaign-images';

const MAX = 12;

type Props = {
  images: string[];
  onChange: (next: string[]) => void;
  token: string;
  api: string;
  disabled?: boolean;
};

export function CampaignImagesEditor({ images, onChange, token, api, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [urlDraft, setUrlDraft] = useState('');
  const [upErr, setUpErr] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const list = input.files;
    if (!list?.length) return;
    const room = MAX - images.length;
    if (room <= 0) return;
    const picked = Array.from(list).slice(0, room);
    // Clear after copying: resetting `value` empties `files` in most browsers.
    input.value = '';
    setUpErr(null);
    setUploading(true);
    try {
      const urls = await uploadCampaignImages(api, token, picked);
      onChange([...images, ...urls].slice(0, MAX));
    } catch (err) {
      setUpErr(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  function addUrl() {
    const u = urlDraft.trim();
    if (!u || images.length >= MAX) return;
    onChange([...images, u]);
    setUrlDraft('');
  }

  function removeAt(i: number) {
    if (images.length <= 1) return;
    onChange(images.filter((_, j) => j !== i));
  }

  const busy = disabled || uploading;

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-amber-950">Campaign images</p>
      <CampaignImageCarousel
        images={images}
        alt="Campaign preview"
        aspectClass="aspect-[16/10]"
        emptyHint="Add photos or URLs below. If you leave this empty, a default cover image is used when you create the campaign."
      />
      {upErr ? <p className="text-sm text-red-700">{upErr}</p> : null}
      <div className="flex flex-wrap gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          tabIndex={-1}
          className="sr-only"
          disabled={busy || images.length >= MAX}
          onChange={(e) => void onPickFiles(e)}
        />
        <button
          type="button"
          disabled={busy || images.length >= MAX}
          onClick={() => inputRef.current?.click()}
          className="rounded-full bg-amber-950/10 px-3 py-1.5 text-xs font-medium text-amber-950 hover:bg-amber-950/15 disabled:opacity-50"
        >
          {uploading ? 'Uploading…' : 'Upload images'}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        <input
          value={urlDraft}
          onChange={(e) => setUrlDraft(e.target.value)}
          placeholder="https://… image URL"
          disabled={busy || images.length >= MAX}
          className="min-w-[180px] flex-1 rounded-lg border border-amber-900/15 px-3 py-2 text-sm outline-none ring-teal-600/30 focus:ring-2"
        />
        <button
          type="button"
          disabled={busy || !urlDraft.trim() || images.length >= MAX}
          onClick={addUrl}
          className="rounded-full bg-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-900 hover:bg-zinc-300 disabled:opacity-50"
        >
          Add URL
        </button>
      </div>
      {images.length ? (
        <ul className="flex flex-wrap gap-2">
          {images.map((src, i) => (
            <li key={`${i}-${src.slice(0, 32)}`} className="relative h-14 w-14 overflow-hidden rounded-lg border border-amber-900/15 bg-amber-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                disabled={busy || images.length <= 1}
                onClick={() => removeAt(i)}
                className="absolute right-0 top-0 rounded-bl bg-amber-950/80 px-1 text-[10px] font-bold text-white hover:bg-amber-950 disabled:opacity-40"
                aria-label="Remove image"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="text-xs text-amber-950/55">Up to {MAX} images. First image is the main thumbnail.</p>
    </div>
  );
}
