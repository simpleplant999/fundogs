'use client';

import { useState } from 'react';
import { CampaignImageCarousel } from '@/components/campaign-image-carousel';
import { ImageDropZone } from '@/components/image-drop-zone';
import { ImageLightbox, useImageLightbox } from '@/components/image-lightbox';
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
  const [upErr, setUpErr] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const { state: stripLightbox, openAt, close, prev, next } = useImageLightbox();

  async function uploadFiles(picked: File[]) {
    const room = MAX - images.length;
    if (room <= 0) {
      setUpErr(`You can attach at most ${MAX} photos.`);
      return;
    }
    const batch = picked.slice(0, room);
    if (!batch.length) return;
    setUpErr(null);
    setUploading(true);
    try {
      const urls = await uploadCampaignImages(api, token, batch);
      onChange([...images, ...urls].slice(0, MAX));
    } catch (err) {
      setUpErr(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  function removeAt(i: number) {
    if (images.length <= 1) return;
    onChange(images.filter((_, j) => j !== i));
  }

  const busy = Boolean(disabled || uploading);

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-amber-950">Campaign images</p>
      <CampaignImageCarousel
        images={images}
        alt="Campaign preview"
        aspectClass="aspect-[16/10]"
        emptyHint="Drop photos below. If you leave this empty, a default cover image is used when you create the campaign."
      />
      {upErr ? <p className="text-sm text-red-700">{upErr}</p> : null}
      <ImageDropZone
        label="Photos"
        description={`Up to ${MAX} images, 4MB each. First image is the main thumbnail.`}
        acceptMultiple
        disabled={busy || images.length >= MAX}
        uploading={uploading}
        browseHint={`or click this area to browse — JPEG, PNG, WebP, GIF, HEIC (max ${MAX})`}
        onChooseFiles={(files) => void uploadFiles(files)}
      />
      {images.length ? (
        <ul className="flex flex-wrap gap-2">
          {images.map((src, i) => (
            <li key={`${i}-${src.slice(0, 32)}`} className="relative h-14 w-14 overflow-hidden rounded-lg border border-amber-900/15 bg-amber-50">
              <button
                type="button"
                title="View larger"
                className="block h-full w-full cursor-zoom-in border-0 bg-transparent p-0"
                onClick={() => openAt(images, i)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-full w-full object-cover" />
              </button>
              <button
                type="button"
                disabled={busy || images.length <= 1}
                onClick={() => removeAt(i)}
                className="absolute right-0 top-0 z-10 rounded-bl bg-amber-950/80 px-1 text-[10px] font-bold text-white hover:bg-amber-950 disabled:opacity-40"
                aria-label="Remove image"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <ImageLightbox
        state={stripLightbox}
        onClose={close}
        onPrev={prev}
        onNext={next}
        ariaLabel="Campaign image"
      />
    </div>
  );
}
