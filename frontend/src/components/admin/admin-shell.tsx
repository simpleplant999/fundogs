'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { useAuth } from '@/providers/auth-provider';

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) {
      router.replace('/');
    }
  }, [loading, user, router]);

  if (loading || !user || user.role !== 'ADMIN') {
    return (
      <div className="flex min-h-0 flex-1 flex-basis-0 items-center justify-center px-4 py-12 text-amber-950/75">
        Checking admin access…
      </div>
    );
  }

  return (
    <div className="grid h-full min-h-0 w-full flex-1 grid-cols-1 grid-rows-[auto_minmax(0,1fr)] overflow-hidden bg-[#fffaf3] lg:grid-cols-[14rem_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)]">
      <AdminSidebar />
      <div className="flex min-h-0 min-w-0 flex-col overflow-hidden lg:min-h-0">
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-amber-900/10 bg-white/80 px-4 py-3 backdrop-blur lg:hidden">
          <span className="text-sm font-semibold text-amber-950">Admin</span>
          <Link href="/" className="text-sm font-medium text-teal-800 underline">
            Site
          </Link>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
