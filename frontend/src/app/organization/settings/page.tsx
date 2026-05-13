'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { OrganizationAdminSubnav } from '@/components/organization-admin-subnav';
import { getClientApiBase, useAuth } from '@/providers/auth-provider';

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

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!api || !token) return;
    setFormErr(null);
    setMsg(null);
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

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <p className="text-sm text-teal-800">
        <Link href="/profile" className="underline">
          ← Profile
        </Link>
        {' · '}
        <Link href={`/organizations/${org.slug}`} className="underline" target="_blank" rel="noreferrer">
          View public page
        </Link>
      </p>
      <h1 className="mt-4 text-3xl font-bold text-amber-950">Organization settings</h1>
      <p className="mt-2 text-sm text-amber-950/75">
        You are the organization admin for <strong>{user.organization.name}</strong>. Changes apply to your public
        organization page.
      </p>

      <OrganizationAdminSubnav current="settings" />

      <div className="mt-6 rounded-2xl border border-amber-900/10 bg-amber-50/40 p-5 shadow-sm">
        <p className="text-sm font-medium text-amber-950">Invite code</p>
        <p className="mt-1 text-xs text-amber-950/65">
          Share this code at registration so people join your organization automatically. To change the code, contact
          a platform admin.
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

      <form
        onSubmit={(e) => void onSave(e)}
        className="mt-8 space-y-4 rounded-2xl border border-amber-900/10 bg-white p-6 shadow-sm"
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
          <span className="mt-1 block text-xs text-amber-950/55">Public URL: /organizations/{slug || '…'}</span>
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
        <label className="block text-sm font-medium text-amber-950">
          Profile photo URL
          <input
            value={profilePhotoUrl}
            onChange={(e) => setProfilePhotoUrl(e.target.value)}
            className="mt-1 w-full rounded-lg border border-amber-900/15 px-3 py-2 outline-none ring-teal-600/30 focus:ring-2"
          />
        </label>
        <label className="block text-sm font-medium text-amber-950">
          Cover photo URL
          <input
            value={coverPhotoUrl}
            onChange={(e) => setCoverPhotoUrl(e.target.value)}
            className="mt-1 w-full rounded-lg border border-amber-900/15 px-3 py-2 outline-none ring-teal-600/30 focus:ring-2"
          />
        </label>
        <label className="block text-sm font-medium text-amber-950">
          Gallery image URLs (one per line)
          <textarea
            rows={4}
            value={photoUrlsText}
            onChange={(e) => setPhotoUrlsText(e.target.value)}
            className="mt-1 w-full rounded-lg border border-amber-900/15 px-3 py-2 font-mono text-xs outline-none ring-teal-600/30 focus:ring-2"
          />
        </label>
        {formErr ? <p className="text-sm text-red-700">{formErr}</p> : null}
        {msg ? <p className="text-sm text-teal-800">{msg}</p> : null}
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </div>
  );
}
