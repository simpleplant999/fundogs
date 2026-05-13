import { AdminOrganizationsPanel } from '@/components/admin/admin-organizations-panel';

export default function AdminOrganizationsPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-bold text-amber-950 sm:text-3xl">Organizations</h1>
      <p className="mt-2 text-sm text-amber-950/75">
        Create rescue groups or chapters, then distribute invite codes for automatic membership on signup.
      </p>
      <div className="mt-8">
        <AdminOrganizationsPanel />
      </div>
    </div>
  );
}
