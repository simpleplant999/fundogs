import { AdminWithdrawalsTable } from '@/components/admin/admin-withdrawals-table';

export default function AdminWithdrawalsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-amber-950">Withdrawals</h1>
      <p className="mt-2 max-w-3xl text-sm text-amber-950/75">
        Review creator payout requests, confirm bank details, and mark payouts as paid to align each campaign&apos;s
        withdrawn balance.
      </p>
      <div className="mt-8">
        <AdminWithdrawalsTable />
      </div>
    </div>
  );
}
