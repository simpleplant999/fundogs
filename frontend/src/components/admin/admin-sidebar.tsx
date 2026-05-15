'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/organizations', label: 'Organizations' },
  { href: '/admin/campaigns', label: 'Campaigns' },
  { href: '/admin/withdrawals', label: 'Withdrawals' },
] as const;

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex min-h-0 w-full flex-col border-b border-amber-900/20 bg-amber-950 text-amber-50 lg:min-h-0 lg:overflow-hidden lg:border-b-0 lg:border-r">
      <div className="shrink-0 px-4 py-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-200/90">FunDogs</p>
        <p className="mt-1 text-lg font-bold text-white">Admin</p>
      </div>
      <nav className="flex flex-wrap gap-1 px-2 pb-4 lg:min-h-0 lg:flex-1 lg:flex-col lg:overflow-y-auto lg:px-2">
        {NAV.map((item) => {
          const active =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? 'bg-white/15 text-white'
                  : 'text-amber-100/85 hover:bg-white/10 hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto hidden border-t border-amber-800/80 p-4 lg:block">
        <Link
          href="/"
          className="text-sm font-medium text-amber-200 underline-offset-2 hover:text-white hover:underline"
        >
          ← Exit to site
        </Link>
      </div>
    </aside>
  );
}
