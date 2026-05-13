import Link from "next/link";
import { OrganizationVerifiedBadge } from "@/components/organization-verified-badge";
import { fetchOrganizations } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function OrganizationsIndexPage() {
  const list = await fetchOrganizations();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-amber-950">Organizations</h1>
      <p className="mt-2 max-w-2xl text-sm text-amber-950/75">
        Rescue groups and chapters on FunDogs. Open a profile to learn more or support their campaigns.
      </p>

      {list === null ? (
        <p className="mt-10 text-amber-950/70">Organizations could not be loaded. Try again later.</p>
      ) : list.length === 0 ? (
        <p className="mt-10 text-amber-950/70">No organizations yet.</p>
      ) : (
        <ul className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((org) => (
            <li key={org.id} className="min-w-0">
              <Link
                href={`/organizations/${org.slug}`}
                className="flex max-h-[500px] flex-col overflow-hidden rounded-2xl border border-amber-900/10 bg-white shadow-sm transition hover:border-teal-700/30 hover:shadow-md"
              >
                <div className="relative aspect-square w-full shrink-0 overflow-hidden bg-amber-100">
                  {org.profilePhotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={org.profilePhotoUrl}
                      alt=""
                      className="h-full w-full object-cover object-center"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-4xl text-amber-950/25" aria-hidden>
                      🐾
                    </div>
                  )}
                  <span className="pointer-events-none absolute bottom-2 right-2">
                    <OrganizationVerifiedBadge compact />
                  </span>
                </div>
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4">
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
                    {org.memberCount === 1 ? "1 member" : `${org.memberCount} members`}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
