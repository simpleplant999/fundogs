import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CampaignCard } from '@/components/campaign-card';
import { ProfileHistoryBackButton } from '@/components/profile-history-back-button';
import { fetchPublicUserProfile } from '@/lib/api';
import type { Campaign } from '@/lib/types';
import { sanitizeInternalReturnPath } from '@/lib/sanitize-return-to';

const backLinkClass =
  'font-medium text-teal-800 underline decoration-teal-800/40 underline-offset-2 hover:decoration-teal-800';

function normalizeCampaignFromApi(c: Campaign): Campaign {
  return {
    ...c,
    goalAmount: Number(c.goalAmount),
    raisedAmount: Number(c.raisedAmount),
  };
}

function isOrgAdminRole(role: string | undefined): boolean {
  return String(role ?? '')
    .trim()
    .toUpperCase() === 'ADMIN';
}

function CampaignGrid({ items }: { items: Campaign[] }) {
  return (
    <ul className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((c) => (
        <li key={c.id}>
          <CampaignCard campaign={c} />
        </li>
      ))}
    </ul>
  );
}

export default async function PublicUserProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ returnTo?: string | string[] }>;
}) {
  const { userId } = await params;
  const sp = await searchParams;
  const returnTo = sanitizeInternalReturnPath(sp.returnTo);
  const profile = await fetchPublicUserProfile(userId);
  if (!profile) notFound();

  const initial = (profile.fullName?.trim().charAt(0) || '?').toUpperCase();
  const photo = profile.profilePhotoUrl?.trim();
  const rawCampaigns = profile.campaigns ?? [];
  const campaigns = rawCampaigns.map(normalizeCampaignFromApi);
  const activeCampaigns = campaigns.filter((c) => c.status === 'Published');
  const completedCampaigns = campaigns.filter((c) => c.status === 'Done');
  const orgAdmin = profile.organization ? isOrgAdminRole(profile.organization.memberRole) : false;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <p className="text-sm text-amber-950/65">
        {returnTo ? (
          <Link href={returnTo} className={backLinkClass}>
            Back
          </Link>
        ) : (
          <ProfileHistoryBackButton />
        )}
      </p>
      <article className="mt-6 overflow-hidden rounded-2xl border border-amber-900/10 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto h-28 w-28 overflow-hidden rounded-full border-2 border-amber-900/10 bg-amber-50">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-amber-950/35">
              {initial}
            </div>
          )}
        </div>
        <h1 className="mt-5 text-2xl font-bold text-amber-950">{profile.fullName}</h1>
        <p className="mt-2 text-sm text-amber-950/60">FunDogs member</p>
        {profile.organization ? (
          <div className="mt-6 text-sm text-amber-950/80">
            <span className="text-amber-950/55">Organization</span>
            <p className="mt-1">
              <Link
                href={`/organizations/${encodeURIComponent(profile.organization.slug)}`}
                className="font-semibold text-teal-800 underline"
              >
                {profile.organization.name}
              </Link>
            </p>
            <span
              className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                orgAdmin
                  ? 'bg-amber-950/10 text-amber-950 ring-1 ring-amber-950/15'
                  : 'bg-amber-100 text-amber-900 ring-1 ring-amber-900/10'
              }`}
            >
              {orgAdmin ? 'Organization admin' : 'Member'}
            </span>
          </div>
        ) : (
          <p className="mt-6 text-sm italic text-amber-950/45">Not part of an organization on FunDogs.</p>
        )}
      </article>

      <section className="mt-12 space-y-10">
        <div>
          <h2 className="text-lg font-bold text-amber-950">Active campaigns</h2>
          <p className="mt-1 text-sm text-amber-950/65">
            Live fundraisers
          </p>
          {activeCampaigns.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-amber-900/15 bg-amber-50/50 px-4 py-8 text-center text-sm text-amber-950/70">
              No active public campaigns.
            </p>
          ) : (
            <CampaignGrid items={activeCampaigns} />
          )}
        </div>

        <div>
          <h2 className="text-lg font-bold text-amber-950">Completed campaigns</h2>
          <p className="mt-1 text-sm text-amber-950/65">Past fundraisers marked done on FunDogs.</p>
          {completedCampaigns.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-amber-900/15 bg-amber-50/50 px-4 py-8 text-center text-sm text-amber-950/70">
              No completed public campaigns.
            </p>
          ) : (
            <CampaignGrid items={completedCampaigns} />
          )}
        </div>
      </section>
    </div>
  );
}
