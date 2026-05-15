'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useId, useState } from 'react';
import { CampaignAuthorProfileLink } from '@/components/campaign-author-profile-link';
import { CampaignImageCarousel } from '@/components/campaign-image-carousel';
import { CampaignImagesEditor } from '@/components/campaign-images-editor';
import { CampaignListThumb } from '@/components/campaign-list-thumb';
import { CampaignPaymongoDonate } from '@/components/campaign-paymongo-donate';
import { CampaignShareMenu } from '@/components/campaign-share-menu';
import { CampaignUpdatesPanel } from '@/components/campaigns/campaign-updates-panel';
import { DonorsList } from '@/components/donors-list';
import { OrganizationVerifiedBadge } from '@/components/organization-verified-badge';
import { ProgressBar } from '@/components/progress-bar';
import { getCampaignImages } from '@/lib/campaign-images';
import {
  formatGoalAmountDisplay,
  formatGoalAmountFromNumber,
  parseGoalAmountInput,
} from '@/lib/goal-amount-input';
import { formatPhp } from '@/lib/format-currency';
import { CAMPAIGN_TYPES, CAMPAIGN_TYPE_LABELS, getCampaignTypeLabel } from '@/lib/campaign-type';
import type { Donor, CampaignTypeId } from '@/lib/types';
import { getClientApiBase, useAuth } from '@/providers/auth-provider';

export type AdminCampaignTableRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  imageUrl: string;
  images?: string[];
  goalAmount: number;
  raisedAmount: number;
  status: string;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  recipientName: string;
  recipientNote: string;
  campaignType?: CampaignTypeId;
  author?: { id: string; email: string; fullName: string; organization?: { name: string; slug: string } | null };
  createdAt?: string;
};

type Props = {
  showHeading?: boolean;
};

function approvalLabel(s?: string) {
  if (!s) return '—';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Approved campaigns that are live on the site (published or completed). */
export function isActiveCampaign(r: AdminCampaignTableRow) {
  return (
    r.approvalStatus === 'approved' &&
    (r.status === 'Published' || r.status === 'Done')
  );
}

function canShowDonateWidgetPreview(r: AdminCampaignTableRow): boolean {
  return isActiveCampaign(r);
}

function PreviewStatusLine({ status }: { status: string }) {
  const copy: Record<string, string> = {
    Published: 'Live — accepting donations.',
    Draft: 'Draft — visible to you and moderators until approved.',
    Archived: 'Archived — historical record; donations are closed.',
    Done: 'Done — goal reached; thank you to everyone who gave.',
  };
  return <p className="text-sm font-medium text-amber-950/80">{copy[status] ?? status}</p>;
}

export function AdminCampaignsTable({ showHeading = true }: Props) {
  const headingId = useId();
  const { token, user, loading } = useAuth();
  const router = useRouter();
  const api = getClientApiBase();
  const [rows, setRows] = useState<AdminCampaignTableRow[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [preview, setPreview] = useState<AdminCampaignTableRow | null>(null);
  const [editRow, setEditRow] = useState<AdminCampaignTableRow | null>(null);
  const [deleteRow, setDeleteRow] = useState<AdminCampaignTableRow | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editImageUrls, setEditImageUrls] = useState<string[]>([]);
  const [editGoal, setEditGoal] = useState('');
  const [editRecipientName, setEditRecipientName] = useState('');
  const [editRecipientNote, setEditRecipientNote] = useState('');
  const [editCampaignType, setEditCampaignType] = useState<CampaignTypeId>('other');
  const [editError, setEditError] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [previewDonors, setPreviewDonors] = useState<Donor[]>([]);
  const [typeFilter, setTypeFilter] = useState<CampaignTypeId | ''>('');

  const load = useCallback(async () => {
    if (!api || !token) return;
    const q = typeFilter ? `?type=${encodeURIComponent(typeFilter)}` : '';
    const res = await fetch(`${api}/admin/campaigns${q}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 403 || res.status === 401) {
      router.replace('/');
      return;
    }
    if (!res.ok) return;
    setRows(await res.json());
  }, [api, token, router, typeFilter]);

  useEffect(() => {
    if (user?.role === 'ADMIN' && token) void load();
  }, [user, token, load]);

  useEffect(() => {
    if (!editRow) return;
    setEditTitle(editRow.title);
    setEditDescription(editRow.description);
    setEditImageUrls(getCampaignImages(editRow));
    setEditGoal(formatGoalAmountFromNumber(editRow.goalAmount));
    setEditRecipientName(editRow.recipientName);
    setEditRecipientNote(editRow.recipientNote);
    setEditCampaignType(editRow.campaignType ?? 'other');
    setEditError(null);
  }, [editRow]);

  const refetchPreviewDonors = useCallback(async () => {
    if (!api || !token || !preview) return;
    const res = await fetch(`${api}/campaigns/${encodeURIComponent(preview.slug)}/donors`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    setPreviewDonors((await res.json()) as Donor[]);
  }, [api, token, preview]);

  useEffect(() => {
    if (!preview) {
      setPreviewDonors([]);
      return;
    }
    void refetchPreviewDonors();
  }, [preview?.id, preview?.slug, refetchPreviewDonors]);

  const modalOpen = !!(preview || editRow || deleteRow);

  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPreview(null);
        setEditRow(null);
        setDeleteRow(null);
      }
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [modalOpen]);

  async function act(id: string, action: 'approve' | 'reject') {
    if (!api || !token) return;
    setMsg(null);
    const res = await fetch(`${api}/admin/campaigns/${id}/${action}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      setMsg('Action failed');
      return;
    }
    setMsg(action === 'approve' ? 'Approved & published.' : 'Rejected.');
    void load();
    setPreview((cur) => (cur?.id === id ? null : cur));
  }

  async function saveEdit() {
    if (!api || !token || !editRow) return;
    setEditError(null);
    const goal = parseGoalAmountInput(editGoal);
    if (!Number.isFinite(goal) || goal < 1) {
      setEditError('Enter a valid goal amount (at least 1).');
      return;
    }
    if (editTitle.trim().length < 3) {
      setEditError('Title must be at least 3 characters.');
      return;
    }
    if (editDescription.trim().length < 10) {
      setEditError('Description must be at least 10 characters.');
      return;
    }
    if (editImageUrls.length < 1) {
      setEditError('Add at least one campaign image.');
      return;
    }
    setEditSaving(true);
    try {
      const res = await fetch(`${api}/admin/campaigns/${editRow.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim(),
          imageUrls: editImageUrls,
          goalAmount: goal,
          recipientName: editRecipientName.trim(),
          recipientNote: editRecipientNote.trim(),
          campaignType: editCampaignType,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setEditError(
          typeof data.message === 'string'
            ? data.message
            : Array.isArray(data.message)
              ? data.message.join(', ')
              : 'Update failed',
        );
        return;
      }
      setMsg('Campaign updated.');
      setEditRow(null);
      void load();
      setPreview((cur) => (cur?.id === editRow.id ? null : cur));
    } finally {
      setEditSaving(false);
    }
  }

  async function confirmDelete() {
    if (!api || !token || !deleteRow) return;
    setDeleteBusy(true);
    try {
      const res = await fetch(`${api}/admin/campaigns/${deleteRow.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setMsg('Delete failed');
        return;
      }
      setMsg('Campaign deleted.');
      setDeleteRow(null);
      setPreview((cur) => (cur?.id === deleteRow.id ? null : cur));
      void load();
    } finally {
      setDeleteBusy(false);
    }
  }

  if (loading || !user || user.role !== 'ADMIN') {
    return <div className="py-8 text-center text-sm text-amber-950/70">Loading campaigns…</div>;
  }

  return (
    <>
      <section className="rounded-2xl border border-amber-900/10 bg-white p-5 shadow-sm sm:p-6">
        {showHeading ? (
          <h2 id={headingId} className="text-xl font-bold text-amber-950">
            Campaigns
            <span className="ml-2 text-base font-normal text-amber-950/60">({rows.length})</span>
          </h2>
        ) : null}
        <p className={`text-sm text-amber-950/65 ${showHeading ? 'mt-2' : ''}`}>
          <strong>Active</strong> rows (published or done, and approved) can be edited or deleted. Pending rows use
          approve / reject.
        </p>
        {msg ? <p className={`text-sm text-teal-800 ${showHeading ? 'mt-2' : 'mt-1'}`}>{msg}</p> : null}

        <div className={`flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center ${showHeading ? 'mt-4' : 'mt-3'}`}>
          <label className="flex flex-col gap-1 text-sm text-amber-950 sm:flex-row sm:items-center sm:gap-2">
            <span className="font-medium text-amber-950/80">Filter by type</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter((e.target.value as CampaignTypeId | '') || '')}
              className="rounded-lg border border-amber-900/15 bg-white px-3 py-2 text-sm text-amber-950 outline-none ring-teal-600/25 focus:ring-2"
            >
              <option value="">All types</option>
              {CAMPAIGN_TYPES.map((id) => (
                <option key={id} value={id}>
                  {CAMPAIGN_TYPE_LABELS[id]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div
          className={`overflow-x-auto rounded-lg border border-amber-900/10 ${showHeading ? 'mt-6' : 'mt-4'}`}
        >
          <table className="min-w-[960px] w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-amber-900/10 bg-amber-50/80 text-xs font-semibold uppercase tracking-wide text-amber-950/70">
                <th className="px-3 py-3">Campaign</th>
                <th className="px-3 py-3">Type</th>
                <th className="px-3 py-3">Author</th>
                <th className="px-3 py-3">Lifecycle</th>
                <th className="px-3 py-3">Approval</th>
                <th className="px-3 py-3">Goal</th>
                <th className="px-3 py-3">Created</th>
                <th className="px-3 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const pending = r.approvalStatus === 'pending';
                const active = isActiveCampaign(r);
                const created = r.createdAt
                  ? new Date(r.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  : '—';
                return (
                  <tr key={r.id} className="border-b border-amber-900/5 odd:bg-white even:bg-amber-50/30">
                    <td className="max-w-[280px] px-3 py-3">
                      <div className="flex items-start gap-3">
                        <CampaignListThumb imageUrl={r.imageUrl} title={r.title} />
                        <div className="min-w-0 flex-1 font-medium text-amber-950">
                          <span className="line-clamp-2">{r.title}</span>
                          {active ? (
                            <span className="mt-1 block text-[10px] font-semibold uppercase tracking-wide text-teal-700">
                              Active
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="max-w-[160px] px-3 py-3 text-xs leading-snug text-amber-950/80">
                      {getCampaignTypeLabel({ campaignType: r.campaignType })}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-amber-950/80">
                      {r.author?.fullName ?? '—'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-amber-950/75">{r.status}</td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <span
                        className={
                          pending
                            ? 'rounded-full bg-amber-200/80 px-2 py-0.5 text-xs font-medium text-amber-950'
                            : r.approvalStatus === 'approved'
                              ? 'rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-900'
                              : 'rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900'
                        }
                      >
                        {approvalLabel(r.approvalStatus)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-amber-950/80">{formatPhp(r.goalAmount)}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-amber-950/70">{created}</td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPreview(r)}
                          className="rounded-full bg-amber-950/10 px-2.5 py-1 text-xs font-medium text-amber-950 hover:bg-amber-950/15"
                        >
                          Preview
                        </button>
                        {pending ? (
                          <>
                            <button
                              type="button"
                              onClick={() => void act(r.id, 'approve')}
                              className="rounded-full bg-teal-700 px-2.5 py-1 text-xs font-medium text-white hover:bg-teal-800"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => void act(r.id, 'reject')}
                              className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-950 ring-1 ring-amber-900/15 hover:bg-amber-200"
                            >
                              Reject
                            </button>
                          </>
                        ) : null}
                        {active ? (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setPreview(null);
                                setEditRow(r);
                              }}
                              className="rounded-full bg-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-900 hover:bg-zinc-300"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteRow(r)}
                              className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-medium text-rose-900 ring-1 ring-rose-200 hover:bg-rose-200"
                            >
                              Delete
                            </button>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!rows.length ? (
          <p className="mt-6 text-sm text-amber-950/70">No campaigns yet.</p>
        ) : null}
      </section>

      {preview ? (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-amber-950/40 p-4 py-8 backdrop-blur-[2px] sm:p-6 sm:py-10"
          role="presentation"
          onClick={() => setPreview(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${headingId}-modal-title`}
            className="relative w-full max-w-6xl rounded-2xl border border-amber-900/15 bg-[#fffaf3] shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreview(null)}
              className="absolute right-3 top-3 z-10 rounded-full bg-[#fffaf3]/90 px-2.5 py-1 text-sm text-amber-950/80 shadow-sm ring-1 ring-amber-900/10 hover:bg-white hover:text-amber-950"
              aria-label="Close preview"
            >
              ✕
            </button>
            <article className="px-4 pb-6 pt-12 sm:px-6 sm:pb-8 sm:pt-14">
              <p className="mb-4 text-xs text-amber-950/55">
                Preview as supporters see it · {preview.author?.fullName ?? '—'}
                {preview.author?.email ? ` · ${preview.author.email}` : ''} · /{preview.slug}
              </p>
              <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
                <div>
                  <CampaignImageCarousel
                    images={getCampaignImages(preview)}
                    alt=""
                    aspectClass="aspect-[16/9]"
                    className="rounded-3xl border border-amber-900/10 shadow-sm"
                  />
                  <div className="mt-6 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-violet-900 ring-1 ring-violet-600/25">
                      {getCampaignTypeLabel({ campaignType: preview.campaignType })}
                    </span>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-900 ring-1 ring-amber-600/25">
                      {preview.status}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
                    <h1
                      id={`${headingId}-modal-title`}
                      className="min-w-0 flex-1 pr-10 text-2xl font-bold tracking-tight text-amber-950 sm:text-3xl lg:pr-0"
                    >
                      {preview.title}
                    </h1>
                    <CampaignShareMenu slug={preview.slug} title={preview.title} />
                  </div>
                  <PreviewStatusLine status={preview.status} />
                  {preview.author ? (
                    <div className="mt-4 space-y-2 text-sm text-amber-950/75">
                      <p>
                        <span className="font-medium text-amber-950/55">Creator</span>{' '}
                        <CampaignAuthorProfileLink
                          campaign={{
                            slug: preview.slug,
                            authorId: preview.author.id,
                            author: {
                              id: preview.author.id,
                              fullName: preview.author.fullName,
                              organization: preview.author.organization ?? null,
                            },
                          }}
                          className="font-medium text-teal-800 underline underline-offset-2 hover:text-teal-900"
                        />
                      </p>
                      {preview.author.organization ? (
                        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="font-medium text-amber-950/55">Organization</span>
                          <Link
                            href={`/organizations/${encodeURIComponent(preview.author.organization.slug)}`}
                            className="font-medium text-teal-800 underline underline-offset-2 hover:text-teal-900"
                          >
                            {preview.author.organization.name}
                          </Link>
                          <OrganizationVerifiedBadge compact />
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                  <p className="mt-5 text-lg leading-relaxed text-amber-950/85">{preview.description}</p>
                  <div className="mt-8 rounded-2xl border border-amber-900/10 bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-amber-950/55">Raised</p>
                        <p className="text-2xl font-bold text-teal-800">{formatPhp(preview.raisedAmount)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-amber-950/55">Goal</p>
                        <p className="text-xl font-semibold text-amber-950">{formatPhp(preview.goalAmount)}</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <ProgressBar raised={preview.raisedAmount} goal={preview.goalAmount} />
                    </div>
                  </div>
                  {api ? (
                    <CampaignUpdatesPanel
                      slug={preview.slug}
                      campaignId={preview.id}
                      api={api}
                      token={token}
                      canPost={!!user?.id && !!preview.author?.id && user.id === preview.author.id}
                    />
                  ) : null}
                </div>

                <aside className="space-y-8 lg:pt-2">
                  {api && canShowDonateWidgetPreview(preview) ? (
                    <CampaignPaymongoDonate
                      slug={preview.slug}
                      api={api}
                      campaignTitle={preview.title}
                      campaignDescription={preview.description}
                      onPaid={() => {
                        void load();
                        void refetchPreviewDonors();
                      }}
                    />
                  ) : null}
                  <section>
                    <h2 className="text-xl font-bold text-amber-950">Recent donors</h2>
                    <div className="mt-4">
                      <DonorsList donors={previewDonors} />
                    </div>
                  </section>
                  <section className="rounded-2xl border border-amber-900/10 bg-white p-4 shadow-sm">
                    <h2 className="text-sm font-bold uppercase tracking-wide text-amber-950/70">Moderator</h2>
                    <dl className="mt-3 space-y-2 text-sm">
                      <div className="flex justify-between gap-4 border-t border-amber-900/10 pt-3 first:border-t-0 first:pt-0">
                        <dt className="text-amber-950/60">Recipient</dt>
                        <dd className="text-right font-medium text-amber-950">{preview.recipientName}</dd>
                      </div>
                      <div className="flex flex-col gap-1 border-t border-amber-900/10 pt-3">
                        <dt className="text-amber-950/60">Recipient note</dt>
                        <dd className="text-amber-950/85">{preview.recipientNote || '—'}</dd>
                      </div>
                      <div className="flex justify-between gap-4 border-t border-amber-900/10 pt-3">
                        <dt className="text-amber-950/60">Approval</dt>
                        <dd className="font-medium text-amber-950">{approvalLabel(preview.approvalStatus)}</dd>
                      </div>
                    </dl>
                  </section>
                </aside>
              </div>

              <div className="mt-8 flex flex-wrap gap-2 border-t border-amber-900/10 pt-6">
                <Link
                  href={`/campaigns/${preview.slug}`}
                  className="rounded-full bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
                >
                  Open live page
                </Link>
                {preview.approvalStatus === 'pending' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => void act(preview.id, 'approve')}
                      className="rounded-full bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
                    >
                      Approve &amp; publish
                    </button>
                    <button
                      type="button"
                      onClick={() => void act(preview.id, 'reject')}
                      className="rounded-full bg-amber-100 px-4 py-2 text-sm font-medium text-amber-950 ring-1 ring-amber-900/20 hover:bg-amber-200"
                    >
                      Reject
                    </button>
                  </>
                ) : null}
                {isActiveCampaign(preview) ? (
                  <button
                    type="button"
                    onClick={() => {
                      setEditRow(preview);
                      setPreview(null);
                    }}
                    className="rounded-full bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-300"
                  >
                    Edit campaign
                  </button>
                ) : null}
              </div>
            </article>
          </div>
        </div>
      ) : null}

      {editRow ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-amber-950/40 p-4 backdrop-blur-[2px]"
          role="presentation"
          onClick={() => !editSaving && setEditRow(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${headingId}-edit-title`}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-amber-900/15 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id={`${headingId}-edit-title`} className="text-xl font-bold text-amber-950">
              Edit campaign
            </h3>
            <p className="mt-1 text-xs text-amber-950/60">Slug stays the same: /{editRow.slug}</p>
            <form
              className="mt-5 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                void saveEdit();
              }}
            >
              <label className="block text-sm font-medium text-amber-950">
                Title
                <input
                  required
                  minLength={3}
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-amber-900/15 px-3 py-2 outline-none ring-teal-600/30 focus:ring-2"
                />
              </label>
              <label className="block text-sm font-medium text-amber-950">
                Description
                <textarea
                  required
                  minLength={10}
                  rows={5}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-amber-900/15 px-3 py-2 outline-none ring-teal-600/30 focus:ring-2"
                />
              </label>
              {token ? (
                <CampaignImagesEditor
                  images={editImageUrls}
                  onChange={setEditImageUrls}
                  token={token}
                  api={api}
                  disabled={editSaving}
                />
              ) : null}
              <label className="block text-sm font-medium text-amber-950">
                Campaign type
                <select
                  required
                  value={editCampaignType}
                  onChange={(e) => setEditCampaignType(e.target.value as CampaignTypeId)}
                  className="mt-1 w-full rounded-lg border border-amber-900/15 bg-white px-3 py-2 outline-none ring-teal-600/30 focus:ring-2"
                >
                  {CAMPAIGN_TYPES.map((id) => (
                    <option key={id} value={id}>
                      {CAMPAIGN_TYPE_LABELS[id]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium text-amber-950">
                Goal amount
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  required
                  placeholder="e.g. 500,000"
                  value={editGoal}
                  onChange={(e) => setEditGoal(formatGoalAmountDisplay(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-amber-900/15 px-3 py-2 outline-none ring-teal-600/30 focus:ring-2"
                />
              </label>
              <label className="block text-sm font-medium text-amber-950">
                Recipient name
                <input
                  required
                  value={editRecipientName}
                  onChange={(e) => setEditRecipientName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-amber-900/15 px-3 py-2 outline-none ring-teal-600/30 focus:ring-2"
                />
              </label>
              <label className="block text-sm font-medium text-amber-950">
                Recipient note
                <textarea
                  required
                  rows={2}
                  value={editRecipientNote}
                  onChange={(e) => setEditRecipientNote(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-amber-900/15 px-3 py-2 outline-none ring-teal-600/30 focus:ring-2"
                />
              </label>
              {editError ? <p className="text-sm text-red-700">{editError}</p> : null}
              <div className="flex flex-wrap gap-2 border-t border-amber-900/10 pt-4">
                <button
                  type="button"
                  disabled={editSaving}
                  onClick={() => setEditRow(null)}
                  className="rounded-full px-4 py-2 text-sm font-medium text-amber-950 ring-1 ring-amber-900/20 hover:bg-amber-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="rounded-full bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
                >
                  {editSaving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {deleteRow ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-amber-950/40 p-4 backdrop-blur-[2px]"
          role="presentation"
          onClick={() => !deleteBusy && setDeleteRow(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${headingId}-del-title`}
            className="w-full max-w-md rounded-2xl border border-amber-900/15 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id={`${headingId}-del-title`} className="text-lg font-bold text-amber-950">
              Delete campaign?
            </h3>
            <p className="mt-2 text-sm text-amber-950/80">
              This removes <strong>{deleteRow.title}</strong> and related donor/comment records. This cannot be
              undone.
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                disabled={deleteBusy}
                onClick={() => setDeleteRow(null)}
                className="rounded-full px-4 py-2 text-sm font-medium text-amber-950 ring-1 ring-amber-900/20 hover:bg-amber-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteBusy}
                onClick={() => void confirmDelete()}
                className="rounded-full bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800 disabled:opacity-60"
              >
                {deleteBusy ? 'Deleting…' : 'Delete permanently'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
