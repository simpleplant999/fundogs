'use client';

import { useCallback, useRef, useState } from 'react';

export function pickImageFiles(list: FileList | File[] | null | undefined): File[] {
  if (!list?.length) return [];
  return Array.from(list).filter((f) => {
    const m = (f.type || '').toLowerCase();
    if (m.startsWith('image/')) return true;
    if (m === 'application/octet-stream' && /\.(jpe?g|png|gif|webp)$/i.test(f.name)) return true;
    return /\.(jpe?g|jfif|png|gif|webp|bmp|heic|heif|avif|tiff?)$/i.test(f.name);
  });
}

type ImageDropZoneProps = {
  label: string;
  description?: string;
  acceptMultiple?: boolean;
  disabled?: boolean;
  uploading?: boolean;
  variant?: 'default' | 'cover';
  /** Extra line under “Drag photos here” */
  browseHint?: string;
  onChooseFiles: (files: File[]) => void | Promise<void>;
};

export function ImageDropZone({
  label,
  description,
  acceptMultiple = false,
  disabled,
  uploading,
  variant = 'default',
  browseHint,
  onChooseFiles,
}: ImageDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const busy = Boolean(disabled || uploading);

  const runFiles = useCallback(
    async (raw: File[]) => {
      if (!raw.length || busy) return;
      const next = acceptMultiple ? raw : raw.slice(0, 1);
      await onChooseFiles(next);
    },
    [acceptMultiple, busy, onChooseFiles],
  );

  function openPicker() {
    if (busy) return;
    try {
      inputRef.current?.click();
    } catch {
      /* ignore */
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (busy) return;
    void runFiles(pickImageFiles(e.dataTransfer.files));
  }

  function onDragEnter(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    const types = Array.from(e.dataTransfer.types ?? []);
    if (!types.includes('Files')) return;
    setDragActive(true);
  }

  function onDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    const next = e.relatedTarget as Node | null;
    if (next && e.currentTarget.contains(next)) return;
    setDragActive(false);
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    e.dataTransfer.dropEffect = 'copy';
  }

  const minH = variant === 'cover' ? 'min-h-[132px]' : 'min-h-[132px]';
  const hint =
    browseHint ??
    (acceptMultiple
      ? 'or click this area to browse — JPEG, PNG, WebP, GIF, HEIC (4MB each)'
      : 'or click this area to browse — JPEG, PNG, WebP, GIF, HEIC (4MB)');

  return (
    <div className="space-y-2">
      <div>
        <span className="text-sm font-medium text-amber-950">{label}</span>
        {description ? <p className="mt-0.5 text-xs text-amber-950/65">{description}</p> : null}
      </div>
      {/* Keep the file input outside any parent <form> by rendering it here as a sibling of the drop surface. */}
      <input
        ref={inputRef}
        form="fundogs-unbound-file-input"
        type="file"
        accept="image/*,.heic,.heif"
        multiple={acceptMultiple}
        tabIndex={-1}
        className="sr-only"
        disabled={busy}
        aria-label={label}
        onChange={(e) => {
          const picked = pickImageFiles(e.target.files);
          e.target.value = '';
          void runFiles(picked);
        }}
      />
      <div
        role="button"
        tabIndex={busy ? -1 : 0}
        aria-label={`${label}. Drag files here or press Enter or Space to browse.`}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onClick={() => openPicker()}
        onKeyDown={(e) => {
          if (busy) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openPicker();
          }
        }}
        className={`relative flex ${minH} cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition outline-none ring-teal-600/30 focus-visible:ring-2 ${
          busy
            ? 'pointer-events-none cursor-not-allowed border-amber-900/15 bg-amber-50/30 opacity-60'
            : dragActive
              ? 'border-teal-600 bg-teal-50/80 ring-2 ring-teal-600/25'
              : 'border-amber-900/25 bg-white/90 hover:border-teal-600/45 hover:bg-teal-50/40'
        }`}
      >
        <span className="text-sm font-semibold text-amber-950">
          {uploading ? 'Uploading…' : acceptMultiple ? 'Drag photos here' : 'Drag a photo here'}
        </span>
        <span className="mt-1 max-w-sm text-xs leading-relaxed text-amber-950/65">{hint}</span>
      </div>
      <div className="flex justify-center">
        <button
          type="button"
          disabled={busy}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            openPicker();
          }}
          className="rounded-full bg-amber-950/10 px-3 py-1.5 text-xs font-medium text-amber-950 hover:bg-amber-950/15 disabled:opacity-50"
        >
          {uploading ? 'Uploading…' : acceptMultiple ? 'Choose files…' : 'Choose file…'}
        </button>
      </div>
    </div>
  );
}

export const OrganizationImageDropZone = ImageDropZone;
