'use client';

import { useCallback, useEffect, useId, useState } from 'react';
import { getClientApiBase, useAuth } from '@/providers/auth-provider';

type OrgOption = { id: string; name: string; slug: string };

type AdminUserRow = {
  id: string;
  email: string;
  fullName: string;
  role: 'USER' | 'ADMIN';
  organizationMemberRole: 'ADMIN' | 'MEMBER' | null;
  createdAt: string;
  organization: OrgOption | null;
};

function parseApiError(data: unknown): string {
  if (!data || typeof data !== 'object') return 'Request failed';
  const d = data as { message?: string | string[] };
  if (Array.isArray(d.message)) return d.message.join(', ');
  if (typeof d.message === 'string') return d.message;
  return 'Request failed';
}

export function AdminUsersTable() {
  const headingId = useId();
  const { token } = useAuth();
  const api = getClientApiBase();
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [orgs, setOrgs] = useState<OrgOption[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [editRow, setEditRow] = useState<AdminUserRow | null>(null);
  const [role, setRole] = useState<'USER' | 'ADMIN'>('USER');
  const [orgId, setOrgId] = useState<string>('');
  const [clearOrg, setClearOrg] = useState(false);
  const [orgMemberRole, setOrgMemberRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!api || !token) return;
    const [uRes, oRes] = await Promise.all([
      fetch(`${api}/admin/users`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${api}/admin/organizations`, { headers: { Authorization: `Bearer ${token}` } }),
    ]);
    if (uRes.ok) setRows(await uRes.json());
    if (oRes.ok) {
      const list = (await oRes.json()) as {
        id: string;
        name: string;
        slug: string;
      }[];
      setOrgs(list.map((o) => ({ id: o.id, name: o.name, slug: o.slug })));
    }
  }, [api, token]);

  useEffect(() => {
    if (token) void load();
  }, [token, load]);

  useEffect(() => {
    if (!editRow) return;
    setRole(editRow.role);
    setOrgId(editRow.organization?.id ?? '');
    setClearOrg(!editRow.organization);
    setOrgMemberRole(editRow.organizationMemberRole === 'ADMIN' ? 'ADMIN' : 'MEMBER');
    setErr(null);
  }, [editRow]);

  async function saveEdit() {
    if (!api || !token || !editRow) return;
    setErr(null);
    setSaving(true);
    try {
      const body: { role?: string; organizationId?: string | null; organizationMemberRole?: string } = {};
      if (role !== editRow.role) body.role = role;

      if (clearOrg) {
        if (editRow.organization) body.organizationId = null;
      } else {
        const target = orgId || null;
        const current = editRow.organization?.id ?? null;
        if (target !== current) {
          if (!target) {
            setErr('Select an organization, or mark “not part of an organization”.');
            setSaving(false);
            return;
          }
          body.organizationId = target;
        } else if (target && orgMemberRole !== (editRow.organizationMemberRole === 'ADMIN' ? 'ADMIN' : 'MEMBER')) {
          body.organizationMemberRole = orgMemberRole;
        }
      }

      if (Object.keys(body).length === 0) {
        setEditRow(null);
        return;
      }
      const res = await fetch(`${api}/admin/users/${editRow.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(parseApiError(data));
        return;
      }
      setMsg('User updated.');
      setEditRow(null);
      void load();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <section className="rounded-2xl border border-amber-900/10 bg-white p-5 shadow-sm sm:p-6">
        <h2 id={headingId} className="text-xl font-bold text-amber-950">
          Users
          <span className="ml-2 text-base font-normal text-amber-950/60">({rows.length})</span>
        </h2>
        {msg ? <p className="mt-2 text-sm text-teal-800">{msg}</p> : null}
        <div className="mt-4 overflow-x-auto rounded-lg border border-amber-900/10">
          <table className="min-w-[860px] w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-amber-900/10 bg-amber-50/80 text-xs font-semibold uppercase tracking-wide text-amber-950/70">
                <th className="px-3 py-3">Name</th>
                <th className="px-3 py-3">Email</th>
                <th className="px-3 py-3">Role</th>
                <th className="px-3 py-3">Organization</th>
                <th className="px-3 py-3">Org role</th>
                <th className="px-3 py-3">Joined</th>
                <th className="px-3 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-amber-900/5 odd:bg-white even:bg-amber-50/30">
                  <td className="px-3 py-3 font-medium text-amber-950">{r.fullName}</td>
                  <td className="max-w-[200px] truncate px-3 py-3 text-amber-950/80">{r.email}</td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <span
                      className={
                        r.role === 'ADMIN'
                          ? 'rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-900'
                          : 'rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900'
                      }
                    >
                      {r.role}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-amber-950/80">
                    {r.organization ? (
                      <span className="line-clamp-2">{r.organization.name}</span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-xs text-amber-950/75">
                    {!r.organization
                      ? '—'
                      : r.organizationMemberRole === 'ADMIN'
                        ? 'Admin'
                        : 'Member'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-amber-950/70">
                    {new Date(r.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setEditRow(r)}
                      className="rounded-full bg-amber-950/10 px-3 py-1 text-xs font-medium text-amber-950 hover:bg-amber-950/15"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!rows.length ? <p className="mt-6 text-sm text-amber-950/70">No users.</p> : null}
      </section>

      {editRow ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-amber-950/40 p-4 backdrop-blur-[2px]"
          role="presentation"
          onClick={() => !saving && setEditRow(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${headingId}-edit-user`}
            className="w-full max-w-md rounded-2xl border border-amber-900/15 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id={`${headingId}-edit-user`} className="text-lg font-bold text-amber-950">
              Edit user
            </h3>
            <p className="mt-1 text-sm text-amber-950/70">
              {editRow.fullName} · {editRow.email}
            </p>
            <div className="mt-5 space-y-4">
              <label className="block text-sm font-medium text-amber-950">
                Role
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'USER' | 'ADMIN')}
                  className="mt-1 w-full rounded-lg border border-amber-900/15 px-3 py-2 outline-none ring-teal-600/30 focus:ring-2"
                >
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </label>
              <label className="flex items-center gap-2 text-sm text-amber-950">
                <input
                  type="checkbox"
                  checked={clearOrg}
                  onChange={(e) => setClearOrg(e.target.checked)}
                />
                Not part of an organization
              </label>
              {!clearOrg ? (
                <label className="block text-sm font-medium text-amber-950">
                  Organization
                  <select
                    value={orgId}
                    onChange={(e) => setOrgId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-amber-900/15 px-3 py-2 outline-none ring-teal-600/30 focus:ring-2"
                  >
                    <option value="">Select…</option>
                    {orgs.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name} ({o.slug})
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              {!clearOrg && orgId ? (
                <label className="block text-sm font-medium text-amber-950">
                  Organization role
                  <select
                    value={orgMemberRole}
                    onChange={(e) => setOrgMemberRole(e.target.value as 'ADMIN' | 'MEMBER')}
                    className="mt-1 w-full rounded-lg border border-amber-900/15 px-3 py-2 outline-none ring-teal-600/30 focus:ring-2"
                  >
                    <option value="MEMBER">Member</option>
                    <option value="ADMIN">Organization admin</option>
                  </select>
                  <span className="mt-1 block text-xs text-amber-950/55">
                    Org admins can edit the organization profile. The first person in an org is assigned admin
                    automatically.
                  </span>
                </label>
              ) : null}
              {err ? <p className="text-sm text-red-700">{err}</p> : null}
              <div className="flex flex-wrap justify-end gap-2 border-t border-amber-900/10 pt-4">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setEditRow(null)}
                  className="rounded-full px-4 py-2 text-sm font-medium text-amber-950 ring-1 ring-amber-900/20 hover:bg-amber-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={saving || (!clearOrg && !orgId)}
                  onClick={() => void saveEdit()}
                  className="rounded-full bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
