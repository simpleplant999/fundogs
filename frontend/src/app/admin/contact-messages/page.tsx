import { AdminContactMessagesTable } from '@/components/admin/admin-contact-messages-table';

export default function AdminContactMessagesPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-amber-950">Contact messages</h1>
      <p className="mt-2 max-w-3xl text-sm text-amber-950/75">
        Inbox for the public contact form: reports and general questions. Use expand to read the full text;
        reply from your mail client via the sender&apos;s address.
      </p>
      <div className="mt-8">
        <AdminContactMessagesTable />
      </div>
    </div>
  );
}
