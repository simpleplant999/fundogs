import Link from 'next/link';
import { OrganizationVerifiedBadge } from '@/components/organization-verified-badge';
import type { PublicOrganizationListItem } from '@/lib/api';

export function OrganizationIndexCard({ org }: { org: PublicOrganizationListItem }) {
  const photo = org.profilePhotoUrl?.trim();

  return (
    <Link
      href={`/organizations/${org.slug}`}
      className="flex max-h-[500px] min-w-0 flex-col overflow-hidden rounded-2xl border border-amber-900/10 bg-white shadow-sm transition hover:border-teal-700/30 hover:shadow-md"
    >
      <div className="relative aspect-square w-full shrink-0 overflow-hidden bg-amber-100">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" className="h-full w-full object-cover object-center" />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl text-amber-950/25" aria-hidden>
            🐾
          </div>
        )}
        <span className="pointer-events-none absolute bottom-2 right-2">
          <OrganizationVerifiedBadge compact />
        </span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4 text-left">
        <h2 className="shrink-0 text-lg font-semibold leading-snug text-amber-950">{org.name}</h2>
        {org.bio ? (
          <p className="mt-2 line-clamp-4 min-h-0 flex-1 text-sm leading-relaxed text-amber-950/70">
            {org.bio}
          </p>
        ) : (
          <p className="mt-2 line-clamp-2 min-h-0 flex-1 text-sm italic text-amber-950/40">
            No description yet.
          </p>
        )}
        <p className="mt-auto shrink-0 pt-2 text-xs text-amber-950/55">
          {org.memberCount === 1 ? '1 member' : `${org.memberCount} members`}
        </p>
      </div>
    </Link>
  );
}
