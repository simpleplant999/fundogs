'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/providers/auth-provider';

const inputClass =
  'w-full max-w-md rounded-lg border border-amber-900/15 px-3 py-2 text-amber-950 outline-none ring-teal-600/30 focus:ring-2';

export default function ProfilePage() {
  const { user, loading, updateMe } = useAuth();
  const [name, setName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [nameErr, setNameErr] = useState<string | null>(null);
  const [nameOk, setNameOk] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPw, setSavingPw] = useState(false);
  const [pwErr, setPwErr] = useState<string | null>(null);
  const [pwOk, setPwOk] = useState<string | null>(null);

  useEffect(() => {
    if (user?.fullName != null) setName(user.fullName);
  }, [user?.fullName]);

  if (loading) {
    return <div className="px-4 py-16 text-center">Loading…</div>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-14 sm:px-6">
        <h1 className="text-2xl font-bold text-amber-950">Profile</h1>
        <p className="mt-3 text-amber-950/80">
          <Link href="/auth/login" className="font-semibold text-teal-800 underline">
            Log in
          </Link>{' '}
          to see your account.
        </p>
      </div>
    );
  }

  async function onSaveName(e: React.FormEvent) {
    e.preventDefault();
    setNameErr(null);
    setNameOk(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setNameErr('Enter your name.');
      return;
    }
    setSavingName(true);
    try {
      await updateMe({ fullName: trimmed });
      setNameOk('Name saved.');
    } catch (err) {
      setNameErr(err instanceof Error ? err.message : 'Could not save.');
    } finally {
      setSavingName(false);
    }
  }

  async function onSavePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwErr(null);
    setPwOk(null);
    if (!currentPassword) {
      setPwErr('Enter your current password.');
      return;
    }
    if (newPassword.length < 8) {
      setPwErr('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwErr('New password and confirmation do not match.');
      return;
    }
    setSavingPw(true);
    try {
      await updateMe({ currentPassword, newPassword });
      setPwOk('Password updated.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPwErr(err instanceof Error ? err.message : 'Could not update password.');
    } finally {
      setSavingPw(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-amber-950">Your profile</h1>
      <div className="mt-8 space-y-8 rounded-2xl border border-amber-900/10 bg-white p-6 shadow-sm">
        <form onSubmit={(e) => void onSaveName(e)} className="space-y-2">
          <label className="block text-sm font-medium text-amber-950" htmlFor="profile-full-name">
            Name
          </label>
          <div className="flex flex-wrap items-end gap-3">
            <input
              id="profile-full-name"
              name="fullName"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setNameOk(null);
                setNameErr(null);
              }}
              minLength={1}
              maxLength={120}
              autoComplete="name"
              className={`min-w-[12rem] flex-1 ${inputClass}`}
            />
            <button
              type="submit"
              disabled={savingName || name.trim() === user.fullName}
              className="rounded-full bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
            >
              {savingName ? 'Saving…' : 'Save name'}
            </button>
          </div>
          {nameErr ? <p className="text-sm text-red-700">{nameErr}</p> : null}
          {nameOk ? <p className="text-sm text-teal-800">{nameOk}</p> : null}
        </form>

        <p>
          <span className="text-sm font-medium text-amber-950/60">Email</span>
          <br />
          <span className="text-lg text-amber-950">{user.email}</span>
        </p>

        <form
          onSubmit={(e) => void onSavePassword(e)}
          className="space-y-3 border-t border-amber-900/10 pt-6"
        >
          <h2 className="text-sm font-semibold text-amber-950">Change password</h2>
          <label className="block text-sm font-medium text-amber-950" htmlFor="profile-current-password">
            Current password
          </label>
          <input
            id="profile-current-password"
            name="currentPassword"
            type="password"
            value={currentPassword}
            onChange={(e) => {
              setCurrentPassword(e.target.value);
              setPwErr(null);
              setPwOk(null);
            }}
            autoComplete="current-password"
            className={inputClass}
          />
          <label className="block text-sm font-medium text-amber-950" htmlFor="profile-new-password">
            New password
          </label>
          <input
            id="profile-new-password"
            name="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              setPwErr(null);
              setPwOk(null);
            }}
            minLength={8}
            autoComplete="new-password"
            className={inputClass}
          />
          <label className="block text-sm font-medium text-amber-950" htmlFor="profile-confirm-password">
            Confirm new password
          </label>
          <input
            id="profile-confirm-password"
            name="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setPwErr(null);
              setPwOk(null);
            }}
            minLength={8}
            autoComplete="new-password"
            className={inputClass}
          />
          {pwErr ? <p className="text-sm text-red-700">{pwErr}</p> : null}
          {pwOk ? <p className="text-sm text-teal-800">{pwOk}</p> : null}
          <button
            type="submit"
            disabled={savingPw}
            className="rounded-full bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
          >
            {savingPw ? 'Updating…' : 'Update password'}
          </button>
        </form>

        {user.organization ? (
          <p>
            <span className="text-sm font-medium text-amber-950/60">Organization</span>
            <br />
            <Link
              href={`/organizations/${user.organization.slug}`}
              className="text-lg font-medium text-teal-800 underline"
            >
              {user.organization.name}
            </Link>
          </p>
        ) : null}

        {user.role === 'ADMIN' ? (
          <div className="border-t border-amber-900/10 pt-4">
            <Link
              href="/admin"
              className="inline-flex rounded-full px-4 py-2 text-sm font-medium text-teal-900 ring-1 ring-teal-700/30 hover:bg-teal-50"
            >
              Admin panel
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
