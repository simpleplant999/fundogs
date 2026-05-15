'use client';

import Link from 'next/link';
import { useCallback, useEffect, useId, useState } from 'react';
import { CampaignCard } from '@/components/campaign-card';
import { ImageLightbox, useImageLightbox } from '@/components/image-lightbox';
import { OrganizationVerifiedBadge } from '@/components/organization-verified-badge';
import { getClientApiBase } from '@/providers/auth-provider';
import type { Campaign } from '@/lib/types';

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

export type PublicOrgProfileMember = {
  id: string;
  fullName: string;
  profilePhotoUrl: string;
  organizationMemberRole: 'ADMIN' | 'MEMBER';
};

type OrgTab = 'campaigns' | 'members' | 'photos';

export function OrganizationPublicClient({ slug }: { slug: string }) {
  const api = getClientApiBase();
  const tabListId = useId();
  const [org, setOrg] = useState<PublicOrganization | null>(null);
  const [status, setStatus] = useState<'loading' | 'ok' | 'missing'>('loading');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [members, setMembers] = useState<PublicOrgProfileMember[]>([]);
  const [extrasLoaded, setExtrasLoaded] = useState(false);
  const [tab, setTab] = useState<OrgTab>('campaigns');
  const { state: lightbox, openAt, close, prev, next } = useImageLightbox();

  const load = useCallback(async () => {
    if (!api) {
      setStatus('missing');
      return;
    }
    setExtrasLoaded(false);
    const orgRes = await fetch(`${api}/organizations/${encodeURIComponent(slug)}`, { cache: 'no-store' });
    if (!orgRes.ok) {
      setOrg(null);
      setStatus('missing');
      return;
    }
    const orgJson = (await orgRes.json()) as PublicOrganization;
    setOrg(orgJson);
    setStatus('ok');

    const [campRes, memRes] = await Promise.all([
      fetch(`${api}/organizations/${encodeURIComponent(slug)}/campaigns`, { cache: 'no-store' }),
      fetch(`${api}/organizations/${encodeURIComponent(slug)}/members`, { cache: 'no-store' }),
    ]);
    setCampaigns(campRes.ok ? ((await campRes.json()) as Campaign[]) : []);
    setMembers(memRes.ok ? ((await memRes.json()) as PublicOrgProfileMember[]) : []);
    setExtrasLoaded(true);
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

  const tabs: { id: OrgTab; label: string }[] = [
    { id: 'campaigns', label: 'Campaigns' },
    { id: 'members', label: 'Members' },
    { id: 'photos', label: 'Photos' },
  ];

  return (
    <article className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6">
      <div className="overflow-hidden rounded-2xl border border-amber-900/10 bg-white shadow-sm">
        <div className="relative aspect-[21/6] w-full bg-amber-100">
          {org.coverPhotoUrl ? (
            <button
              type="button"
              title="View cover photo larger"
              className="relative h-full w-full cursor-zoom-in border-0 bg-transparent p-0"
              onClick={() => openAt([org.coverPhotoUrl], 0)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={org.coverPhotoUrl} alt="" className="h-full w-full object-cover" />
            </button>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-amber-950/45">No cover photo</div>
          )}
        </div>
        <div className="relative px-6 pb-8 pt-0 sm:px-10">
          <div className="-mt-14 flex flex-col items-center sm:-mt-10 sm:flex-row sm:items-end sm:gap-6">
            <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-amber-50 shadow-md sm:h-32 sm:w-32">
              {org.profilePhotoUrl ? (
                <button
                  type="button"
                  title="View logo larger"
                  className="h-full w-full cursor-zoom-in border-0 bg-transparent p-0"
                  onClick={() => openAt([org.profilePhotoUrl], 0)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={org.profilePhotoUrl} alt="" className="h-full w-full object-cover" />
                </button>
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

          <div className="mt-10">
            <nav
              id={tabListId}
              role="tablist"
              aria-label="Organization sections"
              className="flex flex-wrap gap-2 border-b border-amber-900/10 pb-3"
            >
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  id={`${tabListId}-${t.id}`}
                  aria-selected={tab === t.id}
                  aria-controls={`${tabListId}-panel-${t.id}`}
                  tabIndex={tab === t.id ? 0 : -1}
                  onClick={() => setTab(t.id)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold ring-1 transition-colors ${
                    tab === t.id
                      ? 'bg-amber-950 text-amber-50 ring-amber-950'
                      : 'text-amber-950 ring-amber-900/15 hover:bg-amber-50'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </nav>

            {!extrasLoaded ? (
              <p className="mt-6 text-sm text-amber-950/60">Loading…</p>
            ) : (
              <>
                <div
                  id={`${tabListId}-panel-campaigns`}
                  role="tabpanel"
                  aria-labelledby={`${tabListId}-campaigns`}
                  hidden={tab !== 'campaigns'}
                  className="mt-6"
                >
                  {campaigns.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-amber-900/15 bg-amber-50/50 px-4 py-8 text-center text-sm text-amber-950/70">
                      No public campaigns from this organization yet.
                    </p>
                  ) : (
                    <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {campaigns.map((c) => (
                        <li key={c.id} className="h-full">
                          <CampaignCard campaign={c} equalHeight />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div
                  id={`${tabListId}-panel-members`}
                  role="tabpanel"
                  aria-labelledby={`${tabListId}-members`}
                  hidden={tab !== 'members'}
                  className="mt-6"
                >
                  {members.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-amber-900/15 bg-amber-50/50 px-4 py-8 text-center text-sm text-amber-950/70">
                      No members listed.
                    </p>
                  ) : (
                    <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {members.map((m) => {
                        const initial = (m.fullName?.trim().charAt(0) || '?').toUpperCase();
                        const photo = m.profilePhotoUrl?.trim();
                        const profileHref = `/users/${encodeURIComponent(m.id)}?returnTo=${encodeURIComponent(`/organizations/${slug}`)}`;
                        return (
                          <li key={m.id}>
                            <div className="flex h-full flex-col items-center rounded-2xl border border-amber-900/10 bg-white p-5 text-center shadow-sm outline-none ring-teal-600/0 transition-shadow hover:border-amber-900/20 hover:shadow-md focus-within:ring-2 focus-within:ring-teal-600/30">
                              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-2 border-amber-900/10 bg-amber-50 shadow-inner">
                                {photo ? (
                                  <button
                                    type="button"
                                    title="View photo larger"
                                    className="h-full w-full cursor-zoom-in border-0 bg-transparent p-0"
                                    onClick={() => openAt([photo], 0)}
                                  >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={photo} alt="" className="h-full w-full object-cover" />
                                  </button>
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-amber-950/35">
                                    {initial}
                                  </div>
                                )}
                              </div>
                              <Link
                                href={profileHref}
                                className="mt-4 text-base font-semibold leading-snug text-amber-950 underline-offset-2 hover:text-teal-900 hover:underline"
                              >
                                {m.fullName}
                              </Link>
                              <span
                                className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                  m.organizationMemberRole === 'ADMIN'
                                    ? 'bg-amber-950/10 text-amber-950 ring-1 ring-amber-950/15'
                                    : 'bg-amber-100 text-amber-900 ring-1 ring-amber-900/10'
                                }`}
                              >
                                {m.organizationMemberRole === 'ADMIN' ? 'Organization admin' : 'Member'}
                              </span>
                              <Link
                                href={profileHref}
                                className="mt-4 text-sm font-semibold text-teal-800 underline decoration-teal-800/30 underline-offset-2 hover:decoration-teal-800"
                              >
                                View profile
                              </Link>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                <div
                  id={`${tabListId}-panel-photos`}
                  role="tabpanel"
                  aria-labelledby={`${tabListId}-photos`}
                  hidden={tab !== 'photos'}
                  className="mt-6"
                >
                  {gallery.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-amber-900/15 bg-amber-50/50 px-4 py-8 text-center text-sm text-amber-950/70">
                      No gallery photos yet.
                    </p>
                  ) : (
                    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {gallery.map((url) => (
                        <li key={url} className="relative aspect-[4/3] overflow-hidden rounded-xl bg-amber-50">
                          <button
                            type="button"
                            title="View larger"
                            className="h-full w-full cursor-zoom-in border-0 bg-transparent p-0"
                            onClick={() => openAt(gallery, gallery.indexOf(url))}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt="" className="h-full w-full object-cover" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <ImageLightbox state={lightbox} onClose={close} onPrev={prev} onNext={next} ariaLabel="Photo" />
    </article>
  );
}
