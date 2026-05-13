'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { OrganizationAdminSubnav } from '@/components/organization-admin-subnav';
import { getClientApiBase, useAuth } from '@/providers/auth-provider';

type OrgMemberRow = {
  id: string;
  email: string;
  fullName: string;
  platformRole: 'USER' | 'ADMIN';
  organizationMemberRole: 'ADMIN' | 'MEMBER';
  createdAt: string;
};

function parseApiError(data: unknown): string {
  if (!data || typeof data !== 'object') return 'Request failed';
  const d = data as { message?: string | string[] };
  if (Array.isArray(d.message)) return d.message.join(', ');
  if (typeof d.message === 'string') return d.message;
  return 'Request failed';
}

export default function OrganizationMembersPage() {
  const { user, token, loading, refreshMe } = useAuth();
  const router = useRouter();
  const api = getClientApiBase();
  const [rows, setRows] = useState<OrgMemberRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [opErr, setOpErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const canManage = user?.organization?.memberRole === 'ADMIN';
  const orgSlug = user?.organization?.slug;

  const subnavProps = useMemo(
    () => ({
      isOrgAdmin: !!canManage,
      orgSlug: orgSlug ?? '',
    }),
    [canManage, orgSlug],
  );

  const load = useCallback(async () => {
    if (!api || !token) return;
    setLoadError(null);
    const res = await fetch(`${api}/organization-membership/members`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 403 || res.status === 401) {
      setLoadError(
        res.status === 403
          ? 'You do not have access to this member list.'
          : 'Session expired. Please log in again.',
      );
      setRows([]);
      return;
    }
    if (!res.ok) {
      setLoadError('Could not load members.');
      return;
    }
    setRows(await res.json());
  }, [api, token]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth/login');
      return;
    }
    if (!loading && user && !user.organization) {
      router.replace('/profile');
      return;
    }
    if (user?.organization && token) void load();
  }, [loading, user, token, load, router]);

  const adminCount = rows.filter((r) => r.organizationMemberRole === 'ADMIN').length;
  const soleOrgAdmin = adminCount === 1;

  async function patchRole(memberId: string, organizationMemberRole: 'ADMIN' | 'MEMBER') {
    if (!api || !token || !canManage) return;
    setBusyId(memberId);
    setMsg(null);
    setOpErr(null);
    try {
      const res = await fetch(`${api}/organization-membership/members/${memberId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ organizationMemberRole }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setOpErr(parseApiError(data));
        return;
      }
      setMsg('Role updated.');
      await load();
      if (memberId === user?.id && organizationMemberRole === 'MEMBER') {
        await refreshMe();
        router.replace('/profile');
      }
    } finally {
      setBusyId(null);
    }
  }

  async function removeMember(memberId: string) {
    if (!api || !token || !canManage) return;
    if (!window.confirm('Remove this person from your organization?')) return;
    setBusyId(memberId);
    setMsg(null);
    setOpErr(null);
    try {
      const res = await fetch(`${api}/organization-membership/members/${memberId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setOpErr(parseApiError(data));
        return;
      }
      setMsg('Member removed.');
      await load();
      if (memberId === user?.id) {
        await refreshMe();
        router.replace('/profile');
      }
    } finally {
      setBusyId(null);
    }
  }

  if (loading || !user) {
    return <div className="px-4 py-16 text-center text-amber-950/75">Loading…</div>;
  }

  if (!user.organization) {
    return null;
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-lg px-4 py-14 sm:px-6">
        <OrganizationAdminSubnav current="members" {...subnavProps} />
        <h1 className="text-2xl font-bold text-amber-950">Organization members</h1>
        <p className="mt-3 text-amber-950/80">{loadError}</p>
        <p className="mt-6">
          <Link href="/profile" className="font-medium text-teal-800 underline">
            Back to profile
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <p className="text-sm text-teal-800">
        <Link href="/profile" className="underline">
          ← Profile
        </Link>
      </p>
      <h1 className="mt-4 text-3xl font-bold text-amber-950">Organization members</h1>
      <p className="mt-2 text-sm text-amber-950/75">
        {canManage ? (
          <>
            Invite supporters with your organization invite code at signup, or manage roles here. The organization must
            always have at least one organization admin.
          </>
        ) : (
          <>People in your organization. Only organization admins can change roles or remove members.</>
        )}
      </p>

      <OrganizationAdminSubnav current="members" {...subnavProps} />

      {msg ? <p className="mb-2 text-sm text-teal-800">{msg}</p> : null}
      {opErr ? <p className="mb-4 text-sm text-red-700">{opErr}</p> : null}

      <section className="overflow-x-auto rounded-2xl border border-amber-900/10 bg-white shadow-sm">
        <table
          className={`w-full border-collapse text-left text-sm ${canManage ? 'min-w-[720px]' : 'min-w-[560px]'}`}
        >
          <thead>
            <tr className="border-b border-amber-900/10 bg-amber-50/80 text-xs font-semibold uppercase tracking-wide text-amber-950/70">
              <th className="px-3 py-3">Name</th>
              <th className="px-3 py-3">Email</th>
              <th className="px-3 py-3">Site role</th>
              <th className="px-3 py-3">Org role</th>
              <th className="px-3 py-3">Joined</th>
              {canManage ? <th className="px-3 py-3 text-right">Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const isSelf = r.id === user.id;
              const disableRemove = isSelf && soleOrgAdmin && r.organizationMemberRole === 'ADMIN';
              const disableDemote = isSelf && soleOrgAdmin && r.organizationMemberRole === 'ADMIN';
              return (
                <tr key={r.id} className="border-b border-amber-900/5 odd:bg-white even:bg-amber-50/30">
                  <td className="px-3 py-3 font-medium text-amber-950">
                    {r.fullName}
                    {isSelf ? (
                      <span className="ml-2 text-xs font-normal text-amber-950/55">(you)</span>
                    ) : null}
                  </td>
                  <td className="max-w-[200px] truncate px-3 py-3 text-amber-950/80">{r.email}</td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <span
                      className={
                        r.platformRole === 'ADMIN'
                          ? 'rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-900'
                          : 'rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900'
                      }
                    >
                      {r.platformRole}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    {canManage ? (
                      <select
                        value={r.organizationMemberRole}
                        disabled={busyId === r.id || disableDemote}
                        title={
                          disableDemote
                            ? 'Promote another admin before changing your own role.'
                            : undefined
                        }
                        onChange={(e) => {
                          const v = e.target.value as 'ADMIN' | 'MEMBER';
                          if (v === r.organizationMemberRole) return;
                          void patchRole(r.id, v);
                        }}
                        className="rounded-lg border border-amber-900/15 bg-white px-2 py-1.5 text-xs font-medium text-amber-950 outline-none ring-teal-600/30 focus:ring-2 disabled:opacity-50"
                      >
                        <option value="MEMBER">Member</option>
                        <option value="ADMIN">Organization admin</option>
                      </select>
                    ) : (
                      <span
                        className={
                          r.organizationMemberRole === 'ADMIN'
                            ? 'inline-flex rounded-full bg-amber-950/10 px-2 py-0.5 text-xs font-medium text-amber-950'
                            : 'inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900'
                        }
                      >
                        {r.organizationMemberRole === 'ADMIN' ? 'Organization admin' : 'Member'}
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-amber-950/70">
                    {new Date(r.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  {canManage ? (
                    <td className="px-3 py-3 text-right">
                      <button
                        type="button"
                        disabled={busyId === r.id || disableRemove}
                        title={
                          disableRemove
                            ? 'Promote another organization admin before removing yourself.'
                            : undefined
                        }
                        onClick={() => void removeMember(r.id)}
                        className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-medium text-rose-900 ring-1 ring-rose-200 hover:bg-rose-200 disabled:opacity-40"
                      >
                        Remove
                      </button>
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
        {!rows.length ? (
          <p className="p-6 text-sm text-amber-950/70">No members yet. Share your invite code at registration.</p>
        ) : null}
      </section>
    </div>
  );
}
