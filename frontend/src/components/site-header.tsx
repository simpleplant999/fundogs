'use client';

import Link from 'next/link';
import { useAuth } from '@/providers/auth-provider';
import { UserAccountMenu } from '@/components/user-account-menu';

export function SiteHeader() {
  const { user, loading, logout } = useAuth();

  const nav = [
    { href: '/', label: 'Home' },
    { href: '/donate', label: 'Donate Now' },
    { href: '/organizations', label: 'Organizations' },
    ...(user ? [{ href: '/campaigns/dashboard', label: 'My campaigns' }] : []),
  ];

  const navLinkClass =
    'rounded-md px-1 py-0.5 transition hover:text-teal-800 hover:underline underline-offset-4';

  return (
    <header className="sticky top-0 z-50 shrink-0 border-b border-amber-900/10 bg-[#fffaf3]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight text-amber-950">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-600 text-lg text-white"
            aria-hidden
          >
            🐾
          </span>
          <span className="text-lg">FunDogs</span>
        </Link>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium text-amber-950/80">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className={navLinkClass}>
              {item.label}
            </Link>
          ))}
          <Link
            href="/support"
            className="rounded-full bg-teal-700 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
          >
            Support us
          </Link>
          {user?.role === 'ADMIN' ? (
            <Link
              href="/admin"
              className="rounded-md px-1 py-0.5 font-semibold text-teal-900 transition hover:underline"
            >
              Admin
            </Link>
          ) : null}
        </nav>
        <div className="flex flex-wrap items-center justify-end gap-2 sm:ml-2">
          {loading ? (
            <span className="text-xs text-amber-950/55">…</span>
          ) : user ? (
            <UserAccountMenu user={user} onLogout={logout} />
          ) : (
            <>
              <Link
                href="/auth/login"
                className="rounded-full px-3 py-1.5 text-sm font-medium text-amber-950/90 ring-1 ring-amber-900/15 transition hover:bg-amber-900/5"
              >
                Log in
              </Link>
              <Link
                href="/auth/register"
                className="rounded-full bg-teal-700 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-teal-800"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
