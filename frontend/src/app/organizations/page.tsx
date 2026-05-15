import { OrganizationIndexCard } from "@/components/organization-index-card";
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
              <OrganizationIndexCard org={org} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
