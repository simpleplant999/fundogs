'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { UserAccountMenu } from '@/components/user-account-menu';

export function SiteHeader() {
  const { user, loading, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const nav = [
    { href: '/', label: 'Home' },
    { href: '/donate', label: 'Donate Now' },
    { href: '/organizations', label: 'Organizations' },
    ...(user ? [{ href: '/campaigns/dashboard', label: 'My campaigns' }] : []),
  ];

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  const navLinkClass =
    'rounded-md px-1 py-0.5 transition hover:text-teal-800 hover:underline underline-offset-4';

  const navLinkMobileClass =
    'block rounded-lg px-3 py-2.5 text-base font-medium text-amber-950/90 transition hover:bg-amber-900/10';

  return (
    <header className="sticky top-0 z-50 shrink-0 border-b border-amber-900/10 bg-[#fffaf3]/90 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex items-center justify-between gap-3 py-3 md:grid md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-center md:gap-4">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-2 justify-self-start font-semibold tracking-tight text-amber-950"
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-600 text-lg text-white"
              aria-hidden
            >
              🐾
            </span>
            <span className="truncate text-lg">FunDogs</span>
          </Link>
          <nav
            className="hidden items-center justify-center gap-x-4 text-sm font-medium text-amber-950/80 md:flex"
            aria-label="Main"
          >
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
          <div className="flex shrink-0 items-center justify-end gap-2 justify-self-end sm:gap-3">
            <div className="flex flex-wrap items-center justify-end gap-2">
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
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md text-amber-950 ring-1 ring-amber-900/15 transition hover:bg-amber-900/5 md:hidden"
              aria-expanded={mobileOpen}
              aria-controls="site-header-mobile-menu"
              onClick={() => setMobileOpen((o) => !o)}
            >
              <span className="sr-only">{mobileOpen ? 'Close menu' : 'Open menu'}</span>
              {mobileOpen ? (
                <span className="text-2xl leading-none text-amber-950" aria-hidden>
                  ×
                </span>
              ) : (
                <span className="flex flex-col gap-1.5" aria-hidden>
                  <span className="h-0.5 w-5 rounded-full bg-amber-950" />
                  <span className="h-0.5 w-5 rounded-full bg-amber-950" />
                  <span className="h-0.5 w-5 rounded-full bg-amber-950" />
                </span>
              )}
            </button>
          </div>
        </div>
        <div
          id="site-header-mobile-menu"
          className={`border-t border-amber-900/10 pb-4 pt-2 md:hidden ${mobileOpen ? 'block' : 'hidden'}`}
        >
          <nav className="flex flex-col gap-0.5" aria-label="Main">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={navLinkMobileClass}
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/support"
              className="mt-1 rounded-full bg-teal-700 px-3 py-2.5 text-center text-base font-semibold text-white shadow-sm transition hover:bg-teal-800"
              onClick={() => setMobileOpen(false)}
            >
              Support us
            </Link>
            {user?.role === 'ADMIN' ? (
              <Link
                href="/admin"
                className={`${navLinkMobileClass} font-semibold text-teal-900`}
                onClick={() => setMobileOpen(false)}
              >
                Admin
              </Link>
            ) : null}
          </nav>
        </div>
      </div>
    </header>
  );
}
