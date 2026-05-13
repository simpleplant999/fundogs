'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { OrganizationAdminSubnav } from '@/components/organization-admin-subnav';
import { OrganizationImageDropZone } from '@/components/organization-image-drop-zone';
import { OrganizationPublicPreview } from '@/components/organization-public-preview';
import { getClientApiBase, useAuth } from '@/providers/auth-provider';

const ORG_GALLERY_MAX = 24;

type EditableOrg = {
  id: string;
  slug: string;
  name: string;
  bio: string;
  profilePhotoUrl: string;
  coverPhotoUrl: string;
  photoUrls: string[];
  inviteCode: string;
};

function parseApiError(data: unknown): string {
  if (!data || typeof data !== 'object') return 'Request failed';
  const d = data as { message?: string | string[] };
  if (Array.isArray(d.message)) return d.message.join(', ');
  if (typeof d.message === 'string') return d.message;
  return 'Request failed';
}

export default function OrganizationSettingsPage() {
  const { user, token, loading, refreshMe } = useAuth();
  const router = useRouter();
  const api = getClientApiBase();
  const [org, setOrg] = useState<EditableOrg | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [copyHint, setCopyHint] = useState<string | null>(null);
  const [formErr, setFormErr] = useState<string | null>(null);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [previewMemberCount, setPreviewMemberCount] = useState(0);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [bio, setBio] = useState('');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('');
  const [coverPhotoUrl, setCoverPhotoUrl] = useState('');
  const [photoUrlsText, setPhotoUrlsText] = useState('');

  const load = useCallback(async () => {
    if (!api || !token) return;
    setLoadError(null);
    const res = await fetch(`${api}/organization-membership`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 403 || res.status === 401) {
      setLoadError(
        res.status === 403
          ? 'Only the organization admin can edit these settings.'
          : 'Session expired. Please log in again.',
      );
      setOrg(null);
      return;
    }
    if (!res.ok) {
      setLoadError('Could not load organization.');
      return;
    }
    const data = (await res.json()) as EditableOrg;
    setOrg(data);
    setName(data.name);
    setSlug(data.slug);
    setBio(data.bio);
    setProfilePhotoUrl(data.profilePhotoUrl);
    setCoverPhotoUrl(data.coverPhotoUrl);
    setPhotoUrlsText(data.photoUrls.join('\n'));
  }, [api, token]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth/login');
      return;
    }
    if (!loading && user && user.organization?.memberRole !== 'ADMIN') {
      router.replace('/profile');
      return;
    }
    if (user?.organization?.memberRole === 'ADMIN' && token) void load();
  }, [loading, user, token, load, router]);

  useEffect(() => {
    if (!api || !org?.slug) return;
    let cancelled = false;
    void (async () => {
      const res = await fetch(`${api}/organizations/${encodeURIComponent(org.slug)}`, { cache: 'no-store' });
      if (!res.ok || cancelled) return;
      const j = (await res.json()) as { memberCount?: number };
      if (!cancelled) setPreviewMemberCount(j.memberCount ?? 0);
    })();
    return () => {
      cancelled = true;
    };
  }, [api, org?.slug]);

  useEffect(() => {
    if (!editingProfile) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setEditingProfile(false);
        setUploadErr(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editingProfile]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!api || !token) return;
    setFormErr(null);
    setMsg(null);
    setUploadErr(null);
    setSaving(true);
    try {
      const photoUrls = photoUrlsText
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await fetch(`${api}/organization-membership`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          bio: bio.trim(),
          profilePhotoUrl: profilePhotoUrl.trim(),
          coverPhotoUrl: coverPhotoUrl.trim(),
          photoUrls,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFormErr(parseApiError(data));
        return;
      }
      const updated = data as EditableOrg;
      setOrg(updated);
      setMsg('Saved.');
      await refreshMe();
    } finally {
      setSaving(false);
    }
  }

  function parsePhotoLines(text: string): string[] {
    return text
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  async function uploadOrgProfilePhoto(file: File) {
    if (!api || !token) return;
    setUploadErr(null);
    setUploadingProfile(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${api}/organization-membership/profile-photo`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setUploadErr(parseApiError(data));
        return;
      }
      const updated = data as EditableOrg;
      setOrg((o) => (o ? { ...o, profilePhotoUrl: updated.profilePhotoUrl } : updated));
      setProfilePhotoUrl(updated.profilePhotoUrl);
      await refreshMe();
    } finally {
      setUploadingProfile(false);
    }
  }

  async function uploadOrgCoverPhoto(file: File) {
    if (!api || !token) return;
    setUploadErr(null);
    setUploadingCover(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${api}/organization-membership/cover-photo`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setUploadErr(parseApiError(data));
        return;
      }
      const updated = data as EditableOrg;
      setOrg((o) => (o ? { ...o, coverPhotoUrl: updated.coverPhotoUrl } : updated));
      setCoverPhotoUrl(updated.coverPhotoUrl);
      await refreshMe();
    } finally {
      setUploadingCover(false);
    }
  }

  async function uploadOrgGalleryFiles(files: File[]) {
    if (!api || !token || !files.length) return;
    const current = parsePhotoLines(photoUrlsText);
    const room = ORG_GALLERY_MAX - current.length;
    if (room <= 0) {
      setUploadErr(`Gallery is limited to ${ORG_GALLERY_MAX} images.`);
      return;
    }
    const batch = files.slice(0, room);
    setUploadErr(null);
    setUploadingGallery(true);
    try {
      const fd = new FormData();
      for (const f of batch) {
        fd.append('files', f);
      }
      const res = await fetch(`${api}/organization-membership/gallery-photos`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = (await res.json().catch(() => ({}))) as {
        message?: string | string[];
        urls?: string[];
      };
      if (!res.ok) {
        setUploadErr(parseApiError(data));
        return;
      }
      const urls = data.urls ?? [];
      if (!urls.length) {
        setUploadErr('No image URLs returned from server.');
        return;
      }
      const merged = [...current, ...urls].slice(0, ORG_GALLERY_MAX);
      setPhotoUrlsText(merged.join('\n'));
    } finally {
      setUploadingGallery(false);
    }
  }

  async function copyInviteCode() {
    if (!org?.inviteCode) return;
    setCopyHint(null);
    try {
      await navigator.clipboard.writeText(org.inviteCode);
      setCopyHint('Copied to clipboard.');
      window.setTimeout(() => setCopyHint(null), 2500);
    } catch {
      setCopyHint('Could not copy — select the code and copy manually.');
    }
  }

  if (loading || !user) {
    return <div className="px-4 py-16 text-center text-amber-950/75">Loading…</div>;
  }

  if (user.organization?.memberRole !== 'ADMIN') {
    return null;
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-lg px-4 py-14 sm:px-6">
        <h1 className="text-2xl font-bold text-amber-950">Organization settings</h1>
        <p className="mt-3 text-amber-950/80">{loadError}</p>
        <p className="mt-6">
          <Link href="/profile" className="font-medium text-teal-800 underline">
            Back to profile
          </Link>
        </p>
      </div>
    );
  }

  if (!org) {
    return <div className="px-4 py-16 text-center text-amber-950/75">Loading organization…</div>;
  }

  const previewPhotos = parsePhotoLines(photoUrlsText);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <p className="text-sm text-teal-800">
        <Link href="/profile" className="underline">
          ← Profile
        </Link>
        {' · '}
        <Link
          href={`/organizations/${encodeURIComponent(slug || org.slug)}`}
          className="underline"
          target="_blank"
          rel="noreferrer"
        >
          View public page
        </Link>
      </p>
      <h1 className="mt-4 text-3xl font-bold text-amber-950">Organization settings</h1>
      <p className="mt-2 text-sm text-amber-950/75">
        You are the organization admin for <strong>{user.organization.name}</strong>.
        {editingProfile
          ? ' Profile and cover uploads save immediately; other fields use Save changes. Close the editor to see the public preview again.'
          : ' Use the preview below to check your public page, and invite new members with the code on the right.'}
      </p>

      <OrganizationAdminSubnav current="settings" />

      <div className="mt-8 flex flex-col gap-8 xl:flex-row xl:items-start xl:gap-10">
        <div className="min-w-0 flex-1 space-y-5">
          {!editingProfile ? (
            <>
              <OrganizationPublicPreview
                name={name}
                bio={bio}
                profilePhotoUrl={profilePhotoUrl}
                coverPhotoUrl={coverPhotoUrl}
                photoUrls={previewPhotos}
                memberCount={previewMemberCount}
                // subtitle={`Public URL: /organizations/${slug || '…'}`}
              />
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingProfile(true);
                    setUploadErr(null);
                  }}
                  className="rounded-full bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
                >
                  Edit organization profile
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-amber-950">Edit organization profile</h2>
                <button
                  type="button"
                  onClick={() => {
                    setEditingProfile(false);
                    setUploadErr(null);
                  }}
                  className="rounded-full px-4 py-2 text-sm font-semibold text-amber-950 ring-1 ring-amber-900/20 hover:bg-amber-50"
                >
                  Close editor
                </button>
              </div>
              <form
                onSubmit={(e) => void onSave(e)}
                className="space-y-4 rounded-2xl border border-amber-900/10 bg-white p-6 shadow-sm"
              >
                <label className="block text-sm font-medium text-amber-950">
                  Organization name
                  <input
                    required
                    minLength={2}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-amber-900/15 px-3 py-2 outline-none ring-teal-600/30 focus:ring-2"
                  />
                </label>
                <label className="block text-sm font-medium text-amber-950">
                  URL slug
                  <input
                    required
                    minLength={2}
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-amber-900/15 px-3 py-2 font-mono text-sm outline-none ring-teal-600/30 focus:ring-2"
                  />
                  {/* <span className="mt-1 block text-xs text-amber-950/55">
                    Public URL: /organizations/{slug || '…'}
                  </span> */}
                </label>
                <label className="block text-sm font-medium text-amber-950">
                  Bio
                  <textarea
                    rows={5}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-amber-900/15 px-3 py-2 outline-none ring-teal-600/30 focus:ring-2"
                  />
                </label>
                <div className="space-y-2">
                  <OrganizationImageDropZone
                    label="Profile photo"
                    description="Saved immediately when you upload. You can still paste a URL below."
                    acceptMultiple={false}
                    disabled={saving}
                    uploading={uploadingProfile}
                    onChooseFiles={(files) => {
                      const f = files[0];
                      if (f) void uploadOrgProfilePhoto(f);
                    }}
                  />
                  <label className="block text-sm font-medium text-amber-950">
                    Profile photo URL
                    <input
                      value={profilePhotoUrl}
                      onChange={(e) => setProfilePhotoUrl(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-amber-900/15 px-3 py-2 outline-none ring-teal-600/30 focus:ring-2"
                    />
                  </label>
                </div>
                <div className="space-y-2">
                  <OrganizationImageDropZone
                    label="Cover photo"
                    description="Saved immediately when you upload. You can still paste a URL below."
                    acceptMultiple={false}
                    disabled={saving}
                    uploading={uploadingCover}
                    variant="cover"
                    onChooseFiles={(files) => {
                      const f = files[0];
                      if (f) void uploadOrgCoverPhoto(f);
                    }}
                  />
                  <label className="block text-sm font-medium text-amber-950">
                    Cover photo URL
                    <input
                      value={coverPhotoUrl}
                      onChange={(e) => setCoverPhotoUrl(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-amber-900/15 px-3 py-2 outline-none ring-teal-600/30 focus:ring-2"
                    />
                  </label>
                </div>
                <div className="space-y-2">
                  <OrganizationImageDropZone
                    label="Gallery images"
                    description={`Drop up to 12 files at once. URLs are added to the list below (max ${ORG_GALLERY_MAX}); use Save changes to publish.`}
                    acceptMultiple
                    disabled={saving}
                    uploading={uploadingGallery}
                    variant="cover"
                    onChooseFiles={(files) => void uploadOrgGalleryFiles(files)}
                  />
                  <label className="block text-sm font-medium text-amber-950">
                    Gallery image URLs (one per line)
                    <textarea
                      rows={4}
                      value={photoUrlsText}
                      onChange={(e) => setPhotoUrlsText(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-amber-900/15 px-3 py-2 font-mono text-xs outline-none ring-teal-600/30 focus:ring-2"
                    />
                  </label>
                </div>
                {uploadErr ? <p className="text-sm text-red-700">{uploadErr}</p> : null}
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
              </form>
              {formErr ? <p className="text-sm text-red-700">{formErr}</p> : null}
              {msg ? <p className="text-sm text-teal-800">{msg}</p> : null}
            </>
          )}
        </div>

        <aside className="w-full shrink-0 xl:sticky xl:top-24 xl:w-80 xl:self-start">
          <div className="rounded-2xl border border-amber-900/10 bg-amber-50/40 p-5 shadow-sm">
            <p className="text-sm font-medium text-amber-950">Invite code</p>
            <p className="mt-1 text-xs text-amber-950/65">
              Share this code at registration so people join your organization automatically. To change the code,
              contact a platform admin.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <code className="min-w-0 flex-1 break-all rounded-lg border border-amber-900/15 bg-white px-3 py-2 font-mono text-sm font-semibold tracking-wide text-amber-950">
                {org.inviteCode}
              </code>
              <button
                type="button"
                onClick={() => void copyInviteCode()}
                className="shrink-0 rounded-full bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
              >
                Copy
              </button>
            </div>
            {copyHint ? <p className="mt-2 text-xs text-teal-800">{copyHint}</p> : null}
          </div>
        </aside>
      </div>
    </div>
  );
}
