'use client';

import { AdminCampaignsTable } from '@/components/admin/admin-campaigns-table';

export default function AdminCampaignsPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-bold text-amber-950 sm:text-3xl">Campaigns</h1>
      <p className="mt-2 text-sm text-amber-950/75">
        Approve pending campaigns, edit active ones, or delete when needed.
      </p>
      <div className="mt-8">
        <AdminCampaignsTable showHeading={false} />
      </div>
    </div>
  );
}
