'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { ImageLightbox } from '@/components/image-lightbox';
import type { CampaignUpdate } from '@/lib/types';
import { resolveMediaUrlToApiOrigin, uploadCampaignImages } from '@/lib/campaign-images';

const MAX_UPDATE_IMAGES = 6;

function parseApiError(data: unknown): string {
  if (!data || typeof data !== 'object') return 'Request failed';
  const d = data as { message?: string | string[] };
  if (Array.isArray(d.message)) return d.message.join(', ');
  if (typeof d.message === 'string') return d.message;
  return 'Request failed';
}

function formatUpdateDate(iso: string): string {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(d);
  } catch {
    return iso;
  }
}

function updateImages(u: CampaignUpdate): string[] {
  return u.images?.length ? u.images : [];
}

export function CampaignUpdatesPanel({
  slug,
  campaignId,
  api,
  token,
  canPost,
  embedded = false,
}: {
  slug: string;
  campaignId: string;
  api: string;
  token: string | null;
  canPost: boolean;
  /** When true, omit outer spacing and visible title (e.g. inside a tab panel). */
  embedded?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadPreviewBlobsRef = useRef<string[]>([]);
  const tokenRef = useRef<string | null>(token);
  /** Avoids duplicate runs when both `change` and `drop` fire for the same file pick. */
  const imageProcessLockRef = useRef(false);
  /** Browsers may emit a second `change` with no files right after we clear the input value. */
  const clearingFileInputRef = useRef(false);
  const imageSlotsRef = useRef({ draft: 0, preview: 0 });
  const [dragActive, setDragActive] = useState(false);
  const [items, setItems] = useState<CampaignUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [draftImageUrls, setDraftImageUrls] = useState<string[]>([]);
  /** Blob URLs for files currently uploading — shown as previews until the server returns real URLs. */
  const [uploadPreviewUrls, setUploadPreviewUrls] = useState<string[]>([]);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageUploadErr, setImageUploadErr] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [postErr, setPostErr] = useState<string | null>(null);
  const [postOk, setPostOk] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ urls: string[]; index: number } | null>(null);

  const imageBusy = posting || imageUploading;
  const draftDisplayCount = draftImageUrls.length + uploadPreviewUrls.length;
  const mediaUrl = (url: string) => resolveMediaUrlToApiOrigin(api, url);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadErr(null);
    const headers: HeadersInit = {};
    const t = tokenRef.current;
    if (t) headers.Authorization = `Bearer ${t}`;
    try {
      const res = await fetch(`${api}/campaigns/${encodeURIComponent(slug)}/updates`, { headers });
      if (!res.ok) {
        setLoadErr('Could not load updates.');
        setItems([]);
        return;
      }
      const raw = (await res.json()) as CampaignUpdate[];
      setItems(
        raw.map((u) => ({
          ...u,
          images: Array.isArray(u.images) ? u.images : [],
        })),
      );
    } catch {
      setLoadErr('Could not load updates.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [api, slug]);

  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  useLayoutEffect(() => {
    imageSlotsRef.current = {
      draft: draftImageUrls.length,
      preview: uploadPreviewUrls.length,
    };
  }, [draftImageUrls, uploadPreviewUrls]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async campaign updates fetch
    void load();
  }, [load, token]);

  useEffect(() => {
    return () => {
      uploadPreviewBlobsRef.current.forEach((u) => URL.revokeObjectURL(u));
      uploadPreviewBlobsRef.current = [];
    };
  }, []);

  const processImageFiles = useCallback(
    async (fileList: File[]) => {
      if (!fileList.length) {
        return;
      }
      if (imageProcessLockRef.current) {
        setImageUploadErr('Please wait for the current photo upload to finish.');
        return;
      }
      imageProcessLockRef.current = true;
      try {
        const t = tokenRef.current;
        if (!t) {
          setImageUploadErr('Sign in to upload images.');
          return;
        }
        const filtered = fileList.filter(
          (f) =>
            f.type.startsWith('image/') ||
            /\.(jpe?g|jfif|png|gif|webp|bmp|heic|heif|avif|tiff?)$/i.test(f.name) ||
            (f.type === 'application/octet-stream' && /\.(jpe?g|png|gif|webp)$/i.test(f.name)),
        );
        if (!filtered.length) {
          setImageUploadErr('Use image files only (JPEG, PNG, WebP, HEIC, …).');
          return;
        }
        const room = MAX_UPDATE_IMAGES - imageSlotsRef.current.draft - imageSlotsRef.current.preview;
        if (room <= 0) {
          setImageUploadErr(`You can attach at most ${MAX_UPDATE_IMAGES} photos per update.`);
          return;
        }
        const picked = filtered.slice(0, room);
        const objectUrls = picked.map((file) => URL.createObjectURL(file));
        uploadPreviewBlobsRef.current = objectUrls;
        flushSync(() => {
          setUploadPreviewUrls(objectUrls);
          setImageUploadErr(null);
        });
        setImageUploading(true);
        try {
          const urls = await uploadCampaignImages(api, t, picked);
          objectUrls.forEach((u) => URL.revokeObjectURL(u));
          uploadPreviewBlobsRef.current = [];
          setUploadPreviewUrls([]);
          setDraftImageUrls((prev) => [...prev, ...urls].slice(0, MAX_UPDATE_IMAGES));
        } catch (err) {
          objectUrls.forEach((u) => URL.revokeObjectURL(u));
          uploadPreviewBlobsRef.current = [];
          setUploadPreviewUrls([]);
          setImageUploadErr(err instanceof Error ? err.message : 'Upload failed');
        } finally {
          setImageUploading(false);
        }
      } finally {
        imageProcessLockRef.current = false;
      }
    },
    [api],
  );

  function onPickUpdateImages(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    const files = Array.from(input.files ?? []);
    if (files.length === 0) {
      if (clearingFileInputRef.current) {
        clearingFileInputRef.current = false;
      }
      return;
    }
    void processImageFiles(files);
    clearingFileInputRef.current = true;
    input.value = '';
    queueMicrotask(() => {
      clearingFileInputRef.current = false;
    });
  }

  function openUpdateImagePicker() {
    if (imageBusy || draftDisplayCount >= MAX_UPDATE_IMAGES) return;
    const el = fileRef.current;
    if (!el) return;
    /* Use click() only. showPicker() can resolve without firing change in some Chromium builds, which
       breaks previews and upload after the OS dialog closes. */
    try {
      el.click();
    } catch {
      /* ignore */
    }
  }

  function onPhotoDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (imageBusy || draftDisplayCount >= MAX_UPDATE_IMAGES) return;
    void processImageFiles(Array.from(e.dataTransfer.files ?? []));
  }

  function onPhotoDragEnter(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (imageBusy || draftDisplayCount >= MAX_UPDATE_IMAGES) return;
    const types = Array.from(e.dataTransfer.types ?? []);
    if (!types.includes('Files')) return;
    setDragActive(true);
  }

  function onPhotoDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    const next = e.relatedTarget as Node | null;
    if (next && e.currentTarget.contains(next)) return;
    setDragActive(false);
  }

  function onPhotoDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (imageBusy || draftDisplayCount >= MAX_UPDATE_IMAGES) return;
    e.dataTransfer.dropEffect = 'copy';
  }

  function removeDraftImage(i: number) {
    setDraftImageUrls((prev) => prev.filter((_, j) => j !== i));
  }

  async function post(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !canPost) return;
    setPostErr(null);
    setPostOk(null);
    const t = title.trim();
    const b = body.trim();
    if (!b) {
      setPostErr('Write an update before posting.');
      return;
    }
    setPosting(true);
    try {
      const payload: { title?: string; body: string; imageUrls?: string[] } = {
        title: t || undefined,
        body: b,
      };
      if (draftImageUrls.length) payload.imageUrls = draftImageUrls;

      const res = await fetch(`${api}/campaigns/me/${campaignId}/updates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPostErr(parseApiError(data));
        return;
      }
      setBody('');
      setTitle('');
      setDraftImageUrls([]);
      setUploadPreviewUrls([]);
      setImageUploadErr(null);
      setPostOk('Update posted.');
      await load();
    } finally {
      setPosting(false);
    }
  }

  return (
    <section
      className={embedded ? '' : 'mt-10 border-t border-amber-900/10 pt-10'}
      aria-labelledby={embedded ? 'campaign-updates-embedded-title' : undefined}
    >
      {embedded ? (
        <h2 id="campaign-updates-embedded-title" className="sr-only">
          Campaign updates
        </h2>
      ) : (
        <>
          <h2 className="text-xl font-bold text-amber-950">Updates</h2>
          <p className="mt-1 text-sm text-amber-950/65">
            News and milestones for supporters. Shown here for everyone who can view this campaign.
          </p>
        </>
      )}

      {canPost && token ? (
        <div className={`space-y-3 rounded-2xl border border-amber-900/10 bg-amber-50/40 p-4 ${embedded ? 'mt-4' : 'mt-5'}`}>
          {/*
            Keep the file input outside <form>. Some browsers tie the file dialog / change event to form
            context in ways that break programmatic open + preview when the input lives inside the form.
          */}
          <input
            ref={fileRef}
            type="file"
            accept="image/*,.heic,.heif"
            multiple
            tabIndex={-1}
            className="sr-only"
            disabled={imageBusy || draftDisplayCount >= MAX_UPDATE_IMAGES}
            onChange={(e) => void onPickUpdateImages(e)}
          />
          <form className="space-y-3" onSubmit={(e) => void post(e)}>
            <label className="block text-sm font-medium text-amber-950">
              Headline <span className="font-normal text-amber-950/55">(optional)</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                placeholder="e.g. First vet visit complete"
                className="mt-1 w-full rounded-lg border border-amber-900/15 bg-white px-3 py-2 text-sm outline-none ring-teal-600/30 focus:ring-2"
              />
            </label>
            <label className="block text-sm font-medium text-amber-950">
              Update
              <textarea
                required
                rows={4}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={8000}
                placeholder="What changed? How are things going?"
                className="mt-1 w-full rounded-lg border border-amber-900/15 bg-white px-3 py-2 text-sm outline-none ring-teal-600/30 focus:ring-2"
              />
            </label>
            <div className="space-y-2">
              <p className="text-sm font-medium text-amber-950">
                Photos <span className="font-normal text-amber-950/55">(optional, up to {MAX_UPDATE_IMAGES})</span>
              </p>
              <div
                role="button"
                tabIndex={imageBusy || draftDisplayCount >= MAX_UPDATE_IMAGES ? -1 : 0}
                aria-label="Choose photos for this update. Drag files here or press Enter or Space to browse."
                onDragEnter={onPhotoDragEnter}
                onDragLeave={onPhotoDragLeave}
                onDragOver={onPhotoDragOver}
                onDrop={onPhotoDrop}
                onClick={() => openUpdateImagePicker()}
                onKeyDown={(ev) => {
                  if (ev.key !== 'Enter' && ev.key !== ' ') return;
                  ev.preventDefault();
                  openUpdateImagePicker();
                }}
                className={`relative flex min-h-[132px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition outline-none ring-teal-600/30 focus-visible:ring-2 ${
                  draftDisplayCount >= MAX_UPDATE_IMAGES || imageBusy
                    ? 'pointer-events-none cursor-not-allowed border-amber-900/15 bg-amber-50/30 opacity-60'
                    : dragActive
                      ? 'border-teal-600 bg-teal-50/80 ring-2 ring-teal-600/25'
                      : 'border-amber-900/25 bg-white/90 hover:border-teal-600/45 hover:bg-teal-50/40'
                }`}
              >
                <span className="text-sm font-semibold text-amber-950">Drag photos here</span>
                <span className="mt-1 max-w-sm text-xs leading-relaxed text-amber-950/65">
                  or click this area to browse — JPEG, PNG, WebP, GIF, HEIC (max {MAX_UPDATE_IMAGES} per update)
                </span>
              </div>
              <div className="flex justify-center">
                <button
                  type="button"
                  disabled={imageBusy || draftDisplayCount >= MAX_UPDATE_IMAGES}
                  onClick={(ev) => {
                    ev.preventDefault();
                    openUpdateImagePicker();
                  }}
                  className="rounded-full bg-amber-950/10 px-3 py-1.5 text-xs font-medium text-amber-950 hover:bg-amber-950/15 disabled:opacity-50"
                >
                  {imageUploading ? 'Uploading…' : 'Choose files…'}
                </button>
              </div>
            </div>
            {imageUploadErr ? <p className="text-sm text-red-700">{imageUploadErr}</p> : null}
            {draftDisplayCount ? (
              <ul className="flex flex-wrap gap-2">
                {draftImageUrls.map((src, i) => (
                  <li
                    key={`draft-${i}-${src.slice(0, 48)}`}
                    className="relative h-24 w-24 overflow-hidden rounded-lg border border-amber-900/15 bg-amber-50 shadow-sm"
                  >
                    <button
                      type="button"
                      title="View larger"
                      className="block h-full w-full cursor-zoom-in border-0 bg-transparent p-0 text-left"
                      onClick={() =>
                        setLightbox({
                          urls: draftImageUrls.map((u) => mediaUrl(u)),
                          index: i,
                        })
                      }
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={mediaUrl(src)} alt="" className="h-full w-full object-cover" />
                    </button>
                    <button
                      type="button"
                      disabled={imageBusy}
                      onClick={() => removeDraftImage(i)}
                      className="absolute right-0 top-0 rounded-bl bg-amber-950/80 px-1.5 py-0.5 text-[10px] font-bold text-white hover:bg-amber-950 disabled:opacity-40"
                      aria-label="Remove image"
                    >
                      ×
                    </button>
                  </li>
                ))}
                {uploadPreviewUrls.map((src, i) => (
                  <li
                    key={`preview-${i}-${src}`}
                    className="relative h-24 w-24 overflow-hidden rounded-lg border border-dashed border-teal-600/40 bg-teal-50/50 shadow-sm"
                  >
                    <button
                      type="button"
                      title="View preview larger"
                      className="relative z-0 block h-full w-full cursor-zoom-in border-0 bg-transparent p-0 text-left"
                      onClick={() =>
                        setLightbox({
                          urls: [...uploadPreviewUrls],
                          index: i,
                        })
                      }
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" className="h-full w-full object-cover opacity-90" />
                    </button>
                    <div
                      className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-amber-950/25 backdrop-blur-[1px]"
                      aria-hidden
                    >
                      <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal-900 shadow-sm">
                        Uploading
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
            {postErr ? <p className="text-sm text-red-700">{postErr}</p> : null}
            {postOk ? <p className="text-sm text-teal-800">{postOk}</p> : null}
            <button
              type="submit"
              disabled={posting}
              className="rounded-full bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
            >
              {posting ? 'Posting…' : 'Post update'}
            </button>
          </form>
        </div>
      ) : null}

      <div className={embedded ? 'mt-6' : 'mt-8'}>
        {loading ? (
          <p className="text-sm text-amber-950/60">Loading updates…</p>
        ) : loadErr ? (
          <p className="text-sm text-red-700">{loadErr}</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-amber-950/65">
            {canPost
              ? 'No updates yet. Post your first note above when you have news to share.'
              : 'The organizer has not posted any updates yet.'}
          </p>
        ) : (
          <ol className="space-y-0">
            {items.map((u, i) => {
              const imgs = updateImages(u);
              const lightboxUrlsForUpdate = imgs.map((x) => mediaUrl(x));
              return (
                <li key={u.id} className="relative flex gap-4 pb-8 last:pb-0">
                  <div className="flex w-6 shrink-0 flex-col items-center">
                    <div
                      className="z-10 mt-1 h-3 w-3 shrink-0 rounded-full border-2 border-[#fffaf3] bg-teal-600 shadow-sm"
                      aria-hidden
                    />
                    {i < items.length - 1 ? (
                      <div className="mt-1 w-px min-h-[2.5rem] flex-1 bg-teal-600/25" aria-hidden />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <time className="text-xs font-medium uppercase tracking-wide text-amber-950/50">
                      {formatUpdateDate(u.createdAt)}
                    </time>
                    {u.title ? (
                      <h3 className="mt-1 text-base font-semibold text-amber-950">{u.title}</h3>
                    ) : null}
                    <p className="mt-1 whitespace-pre-wrap text-sm text-amber-950/85">{u.body}</p>
                    {imgs.length ? (
                      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {imgs.map((src, j) => (
                          <button
                            key={`${u.id}-img-${j}`}
                            type="button"
                            title="View larger"
                            className="cursor-zoom-in overflow-hidden rounded-lg border border-amber-900/10 bg-amber-50 p-0 ring-teal-600/20 transition hover:ring-2"
                            onClick={() =>
                              setLightbox({ urls: lightboxUrlsForUpdate, index: j })
                            }
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={mediaUrl(src)} alt="" className="aspect-square w-full object-cover" />
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <ImageLightbox
        state={lightbox}
        onClose={() => setLightbox(null)}
        onPrev={() =>
          setLightbox((lb) => (lb && lb.index > 0 ? { urls: lb.urls, index: lb.index - 1 } : lb))
        }
        onNext={() =>
          setLightbox((lb) =>
            lb && lb.index < lb.urls.length - 1 ? { urls: lb.urls, index: lb.index + 1 } : lb,
          )
        }
      />
    </section>
  );
}
