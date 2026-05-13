'use client';

import Link from 'next/link';
import { useCallback, useEffect, useId, useState } from 'react';
import { getClientApiBase, useAuth } from '@/providers/auth-provider';

type OrgListRow = {
  id: string;
  slug: string;
  name: string;
  bio: string;
  profilePhotoUrl: string;
  coverPhotoUrl: string;
  photoUrls: string[];
  inviteCode: string;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
};

type OrgMember = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  organizationMemberRole: string | null;
  createdAt: string;
};

type OrgDetail = OrgListRow & { members: OrgMember[] };

function parseApiError(data: unknown): string {
  if (!data || typeof data !== 'object') return 'Request failed';
  const d = data as { message?: string | string[] };
  if (Array.isArray(d.message)) return d.message.join(', ');
  if (typeof d.message === 'string') return d.message;
  return 'Request failed';
}

export function AdminOrganizationsPanel() {
  const headingId = useId();
  const { token } = useAuth();
  const api = getClientApiBase();
  const [rows, setRows] = useState<OrgListRow[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState<OrgDetail | null>(null);
  const [busy, setBusy] = useState(false);

  const [cName, setCName] = useState('');
  const [cSlug, setCSlug] = useState('');
  const [cBio, setCBio] = useState('');
  const [cProfile, setCProfile] = useState('');
  const [cCover, setCCover] = useState('');
  const [cPhotos, setCPhotos] = useState('');
  const [cErr, setCErr] = useState<string | null>(null);

  const [eName, setEName] = useState('');
  const [eSlug, setESlug] = useState('');
  const [eBio, setEBio] = useState('');
  const [eProfile, setEProfile] = useState('');
  const [eCover, setECover] = useState('');
  const [ePhotos, setEPhotos] = useState('');
  const [eErr, setEErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!api || !token) return;
    const res = await fetch(`${api}/admin/organizations`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setRows(await res.json());
  }, [api, token]);

  useEffect(() => {
    if (token) void load();
  }, [token, load]);

  async function openDetail(id: string) {
    if (!api || !token) return;
    const res = await fetch(`${api}/admin/organizations/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const d = (await res.json()) as OrgDetail;
    setDetail(d);
    setEName(d.name);
    setESlug(d.slug);
    setEBio(d.bio);
    setEProfile(d.profilePhotoUrl);
    setECover(d.coverPhotoUrl);
    setEPhotos(d.photoUrls.join('\n'));
    setEErr(null);
  }

  async function createOrg(e: React.FormEvent) {
    e.preventDefault();
    if (!api || !token) return;
    setCErr(null);
    setBusy(true);
    try {
      const photoUrls = cPhotos
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await fetch(`${api}/admin/organizations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: cName.trim(),
          slug: cSlug.trim() || undefined,
          bio: cBio.trim() || undefined,
          profilePhotoUrl: cProfile.trim() || undefined,
          coverPhotoUrl: cCover.trim() || undefined,
          photoUrls: photoUrls.length ? photoUrls : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCErr(parseApiError(data));
        return;
      }
      setMsg('Organization created.');
      setCreateOpen(false);
      setCName('');
      setCSlug('');
      setCBio('');
      setCProfile('');
      setCCover('');
      setCPhotos('');
      void load();
      void openDetail((data as OrgDetail).id);
    } finally {
      setBusy(false);
    }
  }

  async function saveOrg() {
    if (!api || !token || !detail) return;
    setEErr(null);
    setBusy(true);
    try {
      const photoUrls = ePhotos
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await fetch(`${api}/admin/organizations/${detail.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: eName.trim(),
          slug: eSlug.trim(),
          bio: eBio.trim(),
          profilePhotoUrl: eProfile.trim(),
          coverPhotoUrl: eCover.trim(),
          photoUrls,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setEErr(parseApiError(data));
        return;
      }
      setMsg('Organization saved.');
      void load();
      setDetail(data as OrgDetail);
    } finally {
      setBusy(false);
    }
  }

  async function regenerateInvite() {
    if (!api || !token || !detail) return;
    setBusy(true);
    try {
      const res = await fetch(`${api}/admin/organizations/${detail.id}/regenerate-invite`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return;
      setMsg('New invite code generated.');
      setDetail((cur) => (cur ? { ...cur, inviteCode: (data as { inviteCode: string }).inviteCode } : cur));
      void load();
    } finally {
      setBusy(false);
    }
  }

  async function removeMember(userId: string) {
    if (!api || !token || !detail) return;
    if (!window.confirm('Remove this member from the organization?')) return;
    setBusy(true);
    try {
      const res = await fetch(`${api}/admin/organizations/${detail.id}/members/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      setMsg('Member removed.');
      void openDetail(detail.id);
      void load();
    } finally {
      setBusy(false);
    }
  }

  async function deleteOrg() {
    if (!api || !token || !detail) return;
    if (!window.confirm('Delete this organization? Members will be unlinked.')) return;
    setBusy(true);
    try {
      const res = await fetch(`${api}/admin/organizations/${detail.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      setMsg('Organization deleted.');
      setDetail(null);
      void load();
    } finally {
      setBusy(false);
    }
  }

  function copyInvite(code: string) {
    void navigator.clipboard.writeText(code);
    setMsg('Invite code copied.');
  }

  return (
    <>
      <section className="rounded-2xl border border-amber-900/10 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 id={headingId} className="text-xl font-bold text-amber-950">
              Organizations
              <span className="ml-2 text-base font-normal text-amber-950/60">({rows.length})</span>
            </h2>
            <p className="mt-2 max-w-xl text-sm text-amber-950/70">
              Only admins can create organizations. Share the invite code so supporters join automatically when they
              register.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setCreateOpen(true);
              setCErr(null);
            }}
            className="rounded-full bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
          >
            New organization
          </button>
        </div>
        {msg ? <p className="mt-3 text-sm text-teal-800">{msg}</p> : null}

        <div className="mt-6 overflow-x-auto rounded-lg border border-amber-900/10">
          <table className="min-w-[800px] w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-amber-900/10 bg-amber-50/80 text-xs font-semibold uppercase tracking-wide text-amber-950/70">
                <th className="px-3 py-3">Name</th>
                <th className="px-3 py-3">Slug / URL</th>
                <th className="px-3 py-3">Members</th>
                <th className="px-3 py-3">Invite code</th>
                <th className="px-3 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-amber-900/5 odd:bg-white even:bg-amber-50/30">
                  <td className="px-3 py-3 font-medium text-amber-950">{r.name}</td>
                  <td className="px-3 py-3">
                    <Link
                      href={`/organizations/${r.slug}`}
                      className="text-teal-800 underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      /{r.slug}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-amber-950/80">{r.memberCount}</td>
                  <td className="px-3 py-3 font-mono text-xs text-amber-950">{r.inviteCode}</td>
                  <td className="px-3 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => void openDetail(r.id)}
                      className="rounded-full bg-amber-950/10 px-3 py-1 text-xs font-medium text-amber-950 hover:bg-amber-950/15"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!rows.length ? <p className="mt-6 text-sm text-amber-950/70">No organizations yet.</p> : null}
      </section>

      {createOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-amber-950/40 p-4 backdrop-blur-[2px]"
          role="presentation"
          onClick={() => !busy && setCreateOpen(false)}
        >
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${headingId}-create`}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-amber-900/15 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => void createOrg(e)}
          >
            <h3 id={`${headingId}-create`} className="text-lg font-bold text-amber-950">
              New organization
            </h3>
            <div className="mt-4 space-y-3">
              <label className="block text-sm font-medium text-amber-950">
                Organization name *
                <input
                  required
                  minLength={2}
                  value={cName}
                  onChange={(e) => setCName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-amber-900/15 px-3 py-2 outline-none ring-teal-600/30 focus:ring-2"
                />
              </label>
              <label className="block text-sm font-medium text-amber-950">
                URL slug (optional)
                <input
                  value={cSlug}
                  onChange={(e) => setCSlug(e.target.value)}
                  placeholder="auto from name"
                  className="mt-1 w-full rounded-lg border border-amber-900/15 px-3 py-2 outline-none ring-teal-600/30 focus:ring-2"
                />
              </label>
              <label className="block text-sm font-medium text-amber-950">
                Bio
                <textarea
                  rows={3}
                  value={cBio}
                  onChange={(e) => setCBio(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-amber-900/15 px-3 py-2 outline-none ring-teal-600/30 focus:ring-2"
                />
              </label>
              <label className="block text-sm font-medium text-amber-950">
                Profile photo URL
                <input
                  value={cProfile}
                  onChange={(e) => setCProfile(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-amber-900/15 px-3 py-2 outline-none ring-teal-600/30 focus:ring-2"
                />
              </label>
              <label className="block text-sm font-medium text-amber-950">
                Cover photo URL
                <input
                  value={cCover}
                  onChange={(e) => setCCover(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-amber-900/15 px-3 py-2 outline-none ring-teal-600/30 focus:ring-2"
                />
              </label>
              <label className="block text-sm font-medium text-amber-950">
                Gallery image URLs (one per line)
                <textarea
                  rows={3}
                  value={cPhotos}
                  onChange={(e) => setCPhotos(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-amber-900/15 px-3 py-2 font-mono text-xs outline-none ring-teal-600/30 focus:ring-2"
                />
              </label>
              {cErr ? <p className="text-sm text-red-700">{cErr}</p> : null}
              <div className="flex flex-wrap justify-end gap-2 border-t border-amber-900/10 pt-4">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setCreateOpen(false)}
                  className="rounded-full px-4 py-2 text-sm font-medium text-amber-950 ring-1 ring-amber-900/20 hover:bg-amber-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-full bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
                >
                  {busy ? 'Creating…' : 'Create'}
                </button>
              </div>
            </div>
          </form>
        </div>
      ) : null}

      {detail ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-amber-950/40 p-4 backdrop-blur-[2px]"
          role="presentation"
          onClick={() => !busy && setDetail(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${headingId}-detail`}
            className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-amber-900/15 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h3 id={`${headingId}-detail`} className="text-xl font-bold text-amber-950">
                {detail.name}
              </h3>
              <button
                type="button"
                onClick={() => setDetail(null)}
                className="rounded-full px-2 py-1 text-sm text-amber-950/70 hover:bg-amber-900/10"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <p className="mt-1 text-xs text-amber-950/60">
              Public page:{' '}
              <Link href={`/organizations/${detail.slug}`} className="text-teal-800 underline" target="_blank">
                /organizations/{detail.slug}
              </Link>
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-amber-900/10 bg-amber-50/50 px-3 py-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-amber-950/60">Invite code</span>
              <code className="font-mono text-sm font-semibold text-amber-950">{detail.inviteCode}</code>
              <button
                type="button"
                onClick={() => copyInvite(detail.inviteCode)}
                className="rounded-full bg-amber-950/10 px-2.5 py-1 text-xs font-medium text-amber-950 hover:bg-amber-950/15"
              >
                Copy
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void regenerateInvite()}
                className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-950 ring-1 ring-amber-900/15 hover:bg-amber-200 disabled:opacity-50"
              >
                Regenerate
              </button>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-amber-950">Profile &amp; content</h4>
                <label className="block text-sm font-medium text-amber-950">
                  Name
                  <input
                    value={eName}
                    onChange={(e) => setEName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-amber-900/15 px-3 py-2 outline-none ring-teal-600/30 focus:ring-2"
                  />
                </label>
                <label className="block text-sm font-medium text-amber-950">
                  Slug
                  <input
                    value={eSlug}
                    onChange={(e) => setESlug(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-amber-900/15 px-3 py-2 outline-none ring-teal-600/30 focus:ring-2"
                  />
                </label>
                <label className="block text-sm font-medium text-amber-950">
                  Bio
                  <textarea
                    rows={4}
                    value={eBio}
                    onChange={(e) => setEBio(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-amber-900/15 px-3 py-2 outline-none ring-teal-600/30 focus:ring-2"
                  />
                </label>
                <label className="block text-sm font-medium text-amber-950">
                  Profile photo URL
                  <input
                    value={eProfile}
                    onChange={(e) => setEProfile(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-amber-900/15 px-3 py-2 outline-none ring-teal-600/30 focus:ring-2"
                  />
                </label>
                <label className="block text-sm font-medium text-amber-950">
                  Cover photo URL
                  <input
                    value={eCover}
                    onChange={(e) => setECover(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-amber-900/15 px-3 py-2 outline-none ring-teal-600/30 focus:ring-2"
                  />
                </label>
                <label className="block text-sm font-medium text-amber-950">
                  Gallery URLs (one per line)
                  <textarea
                    rows={3}
                    value={ePhotos}
                    onChange={(e) => setEPhotos(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-amber-900/15 px-3 py-2 font-mono text-xs outline-none ring-teal-600/30 focus:ring-2"
                  />
                </label>
                {eErr ? <p className="text-sm text-red-700">{eErr}</p> : null}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void saveOrg()}
                    className="rounded-full bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
                  >
                    Save changes
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void deleteOrg()}
                    className="rounded-full bg-rose-100 px-4 py-2 text-sm font-medium text-rose-900 ring-1 ring-rose-200 hover:bg-rose-200 disabled:opacity-50"
                  >
                    Delete organization
                  </button>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-amber-950">Members</h4>
                <div className="mt-2 overflow-x-auto rounded-lg border border-amber-900/10">
                  <table className="w-full min-w-[320px] border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-amber-900/10 bg-amber-50/80 text-xs font-semibold uppercase tracking-wide text-amber-950/70">
                        <th className="px-2 py-2">Name</th>
                        <th className="px-2 py-2">Email</th>
                        <th className="px-2 py-2">In org</th>
                        <th className="px-2 py-2 text-right"> </th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.members.map((m) => (
                        <tr key={m.id} className="border-b border-amber-900/5">
                          <td className="px-2 py-2 font-medium text-amber-950">{m.fullName}</td>
                          <td className="max-w-[160px] truncate px-2 py-2 text-amber-950/80">{m.email}</td>
                          <td className="whitespace-nowrap px-2 py-2 text-xs text-amber-950/80">
                            {m.organizationMemberRole === 'ADMIN' ? (
                              <span className="rounded-full bg-teal-100 px-2 py-0.5 font-medium text-teal-900">
                                Admin
                              </span>
                            ) : (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-900">
                                Member
                              </span>
                            )}
                          </td>
                          <td className="px-2 py-2 text-right">
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void removeMember(m.id)}
                              className="rounded-full bg-amber-950/10 px-2 py-0.5 text-xs font-medium text-amber-950 hover:bg-amber-950/15 disabled:opacity-50"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!detail.members.length ? (
                  <p className="mt-2 text-sm text-amber-950/65">No members yet. Share the invite code at registration.</p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
