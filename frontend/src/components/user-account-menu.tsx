'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { AuthUser } from '@/providers/auth-provider';

export function UserAccountMenu({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const orgHref =
    user.organization?.memberRole === 'ADMIN'
      ? '/organization/settings'
      : user.organization
        ? `/organizations/${user.organization.slug}`
        : null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex max-w-[220px] items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium text-amber-950 ring-1 ring-amber-900/10 transition hover:bg-amber-900/5"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="truncate">{user.fullName}</span>
        <span className="shrink-0 text-[10px] text-amber-950/50" aria-hidden>
          ▼
        </span>
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-[60] mt-1 min-w-[12rem] rounded-xl border border-amber-900/10 bg-white py-1 shadow-lg ring-1 ring-amber-900/5"
        >
          <Link
            role="menuitem"
            href="/profile"
            className="block px-4 py-2.5 text-sm text-amber-950 hover:bg-amber-50"
            onClick={() => setOpen(false)}
          >
            Profile
          </Link>
          {orgHref ? (
            <Link
              role="menuitem"
              href={orgHref}
              className="block px-4 py-2.5 text-sm text-amber-950 hover:bg-amber-50"
              onClick={() => setOpen(false)}
            >
              Organization
            </Link>
          ) : null}
          <button
            type="button"
            role="menuitem"
            className="block w-full px-4 py-2.5 text-left text-sm text-amber-950 hover:bg-amber-50"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
          >
            Log out
          </button>
        </div>
      ) : null}
    </div>
  );
}
