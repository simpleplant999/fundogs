'use client';

import { useCallback, useRef, useState } from 'react';

function pickImagesFromList(list: FileList | null): File[] {
  if (!list?.length) return [];
  return Array.from(list).filter((f) => {
    const m = (f.type || '').toLowerCase();
    if (m.startsWith('image/')) return true;
    return /\.(jpe?g|png|gif|webp|bmp|heic|heif|avif)$/i.test(f.name);
  });
}

type OrganizationImageDropZoneProps = {
  label: string;
  description?: string;
  /** When false, only the first image file is passed through. */
  acceptMultiple?: boolean;
  disabled?: boolean;
  uploading?: boolean;
  /** Taller min-height for cover-style strips */
  variant?: 'default' | 'cover';
  onChooseFiles: (files: File[]) => void | Promise<void>;
};

export function OrganizationImageDropZone({
  label,
  description,
  acceptMultiple = false,
  disabled,
  uploading,
  variant = 'default',
  onChooseFiles,
}: OrganizationImageDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const depthRef = useRef(0);

  const busy = Boolean(disabled || uploading);

  const runFiles = useCallback(
    async (raw: File[]) => {
      if (!raw.length || busy) return;
      const next = acceptMultiple ? raw : raw.slice(0, 1);
      await onChooseFiles(next);
    },
    [acceptMultiple, busy, onChooseFiles],
  );

  const minH = variant === 'cover' ? 'min-h-[100px]' : 'min-h-[88px]';

  return (
    <div className="space-y-2">
      <div>
        <span className="text-sm font-medium text-amber-950">{label}</span>
        {description ? (
          <p className="mt-0.5 text-xs text-amber-950/65">{description}</p>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={acceptMultiple}
        className="sr-only"
        disabled={busy}
        aria-label={label}
        onChange={(e) => {
          const picked = pickImagesFromList(e.target.files);
          e.target.value = '';
          void runFiles(picked);
        }}
      />
      <div
        role="group"
        aria-label={label}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          depthRef.current += 1;
          setOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          depthRef.current -= 1;
          if (depthRef.current <= 0) {
            depthRef.current = 0;
            setOver(false);
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          depthRef.current = 0;
          setOver(false);
          void runFiles(pickImagesFromList(e.dataTransfer.files));
        }}
        className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-5 text-center transition-colors ${minH} ${
          over && !busy
            ? 'border-teal-600 bg-teal-50/80 ring-2 ring-teal-600/25'
            : 'border-amber-900/20 bg-amber-50/30'
        } ${busy ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-amber-900/35 hover:bg-amber-50/50'}`}
        onClick={() => {
          if (!busy) inputRef.current?.click();
        }}
        onKeyDown={(e) => {
          if (busy) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        tabIndex={busy ? -1 : 0}
      >
        <p className="text-sm text-amber-950/85">
          {uploading ? 'Uploading…' : 'Drop an image here, or click to choose'}
        </p>
        <p className="text-xs text-amber-950/55">JPEG, PNG, WebP, etc. · up to 5 MB per file</p>
      </div>
    </div>
  );
}
