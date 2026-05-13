'use client';

import Link from 'next/link';
import { OrganizationVerifiedBadge } from '@/components/organization-verified-badge';
import { useCallback, useEffect, useState } from 'react';
import { getClientApiBase } from '@/providers/auth-provider';

export type PublicOrganization = {
  id: string;
  slug: string;
  name: string;
  bio: string;
  profilePhotoUrl: string;
  coverPhotoUrl: string;
  photoUrls: string[];
  memberCount: number;
  createdAt: string;
};

export function OrganizationPublicClient({ slug }: { slug: string }) {
  const api = getClientApiBase();
  const [org, setOrg] = useState<PublicOrganization | null>(null);
  const [status, setStatus] = useState<'loading' | 'ok' | 'missing'>('loading');

  const load = useCallback(async () => {
    if (!api) {
      setStatus('missing');
      return;
    }
    const res = await fetch(`${api}/organizations/${encodeURIComponent(slug)}`, { cache: 'no-store' });
    if (!res.ok) {
      setOrg(null);
      setStatus('missing');
      return;
    }
    setOrg(await res.json());
    setStatus('ok');
  }, [api, slug]);

  useEffect(() => {
    void load();
  }, [load]);

  if (status === 'loading') {
    return <div className="px-4 py-16 text-center text-amber-950/75">Loading…</div>;
  }

  if (status === 'missing' || !org) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
        <h1 className="text-2xl font-bold text-amber-950">Organization not found</h1>
        <p className="mt-3 text-amber-950/75">
          <Link href="/" className="text-teal-800 underline">
            Back home
          </Link>
        </p>
      </div>
    );
  }

  const gallery = org.photoUrls?.length ? org.photoUrls : [];

  return (
    <article className="mx-auto max-w-4xl px-4 pb-16 pt-8 sm:px-6">
      <div className="overflow-hidden rounded-2xl border border-amber-900/10 bg-white shadow-sm">
        <div className="relative aspect-[21/9] w-full bg-amber-100">
          {org.coverPhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={org.coverPhotoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-amber-950/45">No cover photo</div>
          )}
        </div>
        <div className="relative px-6 pb-8 pt-0 sm:px-10">
          <div className="-mt-14 flex flex-col items-center sm:-mt-10 sm:flex-row sm:items-end sm:gap-6">
            <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-amber-50 shadow-md sm:h-32 sm:w-32">
              {org.profilePhotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={org.profilePhotoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-amber-950/40">No logo</div>
              )}
            </div>
            <div className="mt-4 pt-0 text-center sm:mb-2 sm:mt-0 sm:flex-1 sm:pt-0 sm:text-left">
              <div className="flex flex-col items-center gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                <h1 className="text-2xl font-bold text-amber-950 sm:text-3xl">{org.name}</h1>
                <OrganizationVerifiedBadge className="hidden sm:inline-flex" />
              </div>
              <p className="mt-1 text-sm text-amber-950/65">{org.memberCount} members on FunDogs</p>
            </div>
          </div>
          {org.bio ? (
            <p className="mt-8 whitespace-pre-wrap text-amber-950/85">{org.bio}</p>
          ) : (
            <p className="mt-8 text-sm italic text-amber-950/50">No bio yet.</p>
          )}
          {gallery.length ? (
            <div className="mt-10">
              <h2 className="text-sm font-bold uppercase tracking-wide text-amber-950/55">Photos</h2>
              <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {gallery.map((url) => (
                  <li key={url} className="relative aspect-[4/3] overflow-hidden rounded-xl bg-amber-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="h-full w-full object-cover" />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
