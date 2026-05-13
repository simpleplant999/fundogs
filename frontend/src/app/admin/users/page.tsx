import { AdminUsersTable } from '@/components/admin/admin-users-table';

export default function AdminUsersPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-bold text-amber-950 sm:text-3xl">Users</h1>
      <p className="mt-2 text-sm text-amber-950/75">
        View all accounts, assign platform roles, and attach supporters to an organization.
      </p>
      <div className="mt-8">
        <AdminUsersTable />
      </div>
    </div>
  );
}
