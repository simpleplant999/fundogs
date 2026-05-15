'use client';

import { OrganizationVerifiedBadge } from '@/components/organization-verified-badge';
import { ImageLightbox, useImageLightbox } from '@/components/image-lightbox';

export type OrganizationPublicPreviewProps = {
  name: string;
  bio: string;
  profilePhotoUrl: string;
  coverPhotoUrl: string;
  photoUrls: string[];
  memberCount: number;
  /** Shown under the title (e.g. public URL path). */
  subtitle?: string;
};

/**
 * Static preview matching the public organization page hero and gallery,
 * without campaigns/members data or tab navigation.
 */
export function OrganizationPublicPreview({
  name,
  bio,
  profilePhotoUrl,
  coverPhotoUrl,
  photoUrls,
  memberCount,
  subtitle,
}: OrganizationPublicPreviewProps) {
  const gallery = photoUrls?.length ? photoUrls : [];
  const { state, openAt, close, prev, next } = useImageLightbox();

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-amber-900/10 bg-white shadow-sm">
        <div className="relative aspect-[21/6] w-full bg-amber-100">
          {coverPhotoUrl ? (
            <button
              type="button"
              title="View cover photo larger"
              className="relative h-full w-full cursor-zoom-in border-0 bg-transparent p-0"
              onClick={() => openAt([coverPhotoUrl], 0)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={coverPhotoUrl} alt="" className="h-full w-full object-cover" />
            </button>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-amber-950/45">No cover photo</div>
          )}
        </div>
        <div className="relative px-4 pb-6 pt-0 sm:px-8">
          <div className="-mt-12 flex flex-col items-center sm:-mt-10 sm:flex-row sm:items-end sm:gap-6">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-amber-50 shadow-md sm:h-28 sm:w-28">
              {profilePhotoUrl ? (
                <button
                  type="button"
                  title="View logo larger"
                  className="h-full w-full cursor-zoom-in border-0 bg-transparent p-0"
                  onClick={() => openAt([profilePhotoUrl], 0)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={profilePhotoUrl} alt="" className="h-full w-full object-cover" />
                </button>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-amber-950/40">No logo</div>
              )}
            </div>
            <div className="mt-1 text-center sm:mb-1 sm:mt-0 sm:flex-1 sm:pt-0 sm:text-left">
              <div className="flex flex-col items-center gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                <h2 className="text-xl font-bold text-amber-950 sm:text-2xl">{name || 'Organization name'}</h2>
                <OrganizationVerifiedBadge className="hidden sm:inline-flex" />
              </div>
              <p className="mt-1 text-sm text-amber-950/65">{memberCount} members on FunDogs</p>
              {subtitle ? <p className="mt-1 font-mono text-xs text-amber-950/50">{subtitle}</p> : null}
            </div>
          </div>
          {bio ? (
            <p className="mt-6 whitespace-pre-wrap text-sm text-amber-950/85 sm:text-base">{bio}</p>
          ) : (
            <p className="mt-6 text-sm italic text-amber-950/50">No bio yet.</p>
          )}

          <div className="mt-6 border-t border-amber-900/10 pt-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-950/45">Gallery preview</p>
            {gallery.length === 0 ? (
              <p className="mt-3 rounded-xl border border-dashed border-amber-900/15 bg-amber-50/50 px-3 py-6 text-center text-sm text-amber-950/70">
                No gallery photos yet.
              </p>
            ) : (
              <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
                {gallery.slice(0, 6).map((url) => (
                  <li key={url} className="relative aspect-[4/3] overflow-hidden rounded-xl bg-amber-50">
                    <button
                      type="button"
                      title="View larger"
                      className="h-full w-full cursor-zoom-in border-0 bg-transparent p-0"
                      onClick={() => openAt(gallery.slice(0, 6), gallery.slice(0, 6).indexOf(url))}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="h-full w-full object-cover" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {gallery.length > 6 ? (
              <p className="mt-2 text-center text-xs text-amber-950/50">+{gallery.length - 6} more on the public page</p>
            ) : null}
          </div>
        </div>
      </div>
      <ImageLightbox state={state} onClose={close} onPrev={prev} onNext={next} ariaLabel="Photo" />
    </>
  );
}
