'use client';

import Link from 'next/link';

type NavKey = 'settings' | 'members';

export function OrganizationAdminSubnav({
  current,
  isOrgAdmin = true,
  orgSlug,
}: {
  current: NavKey;
  /** When false, only show read-only org navigation (e.g. org members viewing the list). */
  isOrgAdmin?: boolean;
  orgSlug?: string;
}) {
  const base =
    'rounded-full px-3 py-1.5 text-sm font-medium ring-1 transition-colors';
  const active = 'bg-amber-950 text-amber-50 ring-amber-950';
  const idle = 'text-amber-950 ring-amber-900/15 hover:bg-amber-50';

  if (!isOrgAdmin && orgSlug) {
    return (
      <nav className="mb-8 flex flex-wrap gap-2 border-b border-amber-900/10 pb-4" aria-label="Organization">
        <Link href={`/organizations/${orgSlug}`} className={`${base} ${idle}`}>
          Organization page
        </Link>
        <span
          className={`${base} ${current === 'members' ? active : idle} cursor-default`}
          aria-current={current === 'members' ? 'page' : undefined}
        >
          Members
        </span>
      </nav>
    );
  }

  return (
    <nav className="mb-8 flex flex-wrap gap-2 border-b border-amber-900/10 pb-4" aria-label="Organization admin">
      <Link
        href="/organization/settings"
        className={`${base} ${current === 'settings' ? active : idle}`}
      >
        Profile &amp; branding
      </Link>
      <Link
        href="/organization/members"
        className={`${base} ${current === 'members' ? active : idle}`}
      >
        Members
      </Link>
    </nav>
  );
}
