'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/providers/auth-provider';

const inputClass =
  'w-full max-w-md rounded-lg border border-amber-900/15 px-3 py-2 text-amber-950 outline-none ring-teal-600/30 focus:ring-2';

export default function ProfilePage() {
  const { user, loading, updateMe, uploadProfilePhoto } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingRemovePhoto, setPendingRemovePhoto] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileErr, setProfileErr] = useState<string | null>(null);
  const [profileOk, setProfileOk] = useState<string | null>(null);
  const [name, setName] = useState('');

  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPw, setSavingPw] = useState(false);
  const [pwErr, setPwErr] = useState<string | null>(null);

  useEffect(() => {
    if (user?.fullName != null) setName(user.fullName);
  }, [user?.fullName]);

  useEffect(() => {
    if (!photoFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(photoFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  useEffect(() => {
    if (!passwordModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPasswordModalOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [passwordModalOpen]);

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

  const displayAvatarSrc =
    previewUrl ||
    (!pendingRemovePhoto ? user.profilePhotoUrl : undefined) ||
    null;

  async function onSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    const u = user;
    if (!u) return;
    setProfileErr(null);
    setProfileOk(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setProfileErr('Enter your name.');
      return;
    }
    const nameChanged = trimmed !== u.fullName;
    const hasNewPhoto = Boolean(photoFile);
    const willRemovePhoto = pendingRemovePhoto && !hasNewPhoto;

    if (!nameChanged && !hasNewPhoto && !willRemovePhoto) {
      setProfileErr('No changes to save.');
      return;
    }

    setSavingProfile(true);
    try {
      if (hasNewPhoto) {
        await uploadProfilePhoto(photoFile!);
        setPhotoFile(null);
        setPendingRemovePhoto(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else if (willRemovePhoto) {
        await updateMe({ profilePhotoUrl: '' });
        setPendingRemovePhoto(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
      if (nameChanged) {
        await updateMe({ fullName: trimmed });
      }
      setProfileOk('Profile saved.');
    } catch (err) {
      setProfileErr(err instanceof Error ? err.message : 'Could not save profile.');
    } finally {
      setSavingProfile(false);
    }
  }

  async function onSavePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwErr(null);
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
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordModalOpen(false);
      setProfileOk('Password updated.');
      setProfileErr(null);
    } catch (err) {
      setPwErr(err instanceof Error ? err.message : 'Could not update password.');
    } finally {
      setSavingPw(false);
    }
  }

  function closePasswordModal() {
    setPasswordModalOpen(false);
    setPwErr(null);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-amber-950">Your profile</h1>
      <div className="mt-8 space-y-8 rounded-2xl border border-amber-900/10 bg-white p-6 shadow-sm">
        <form onSubmit={(e) => void onSaveProfile(e)} className="space-y-8">
          <div>
            <h2 className="text-sm font-semibold text-amber-950">Profile photo</h2>
            <p className="mt-1 text-xs text-amber-950/65">
              Upload a picture from your device (JPEG, PNG, WebP, etc., up to 5 MB). Changes apply when you save
              below.
            </p>
            {pendingRemovePhoto && !photoFile ? (
              <p className="mt-2 text-xs font-medium text-amber-900/70">
                Photo will be removed when you save.
              </p>
            ) : null}
            <div className="mt-4 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full border-2 border-amber-900/15 bg-amber-50">
                {displayAvatarSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={displayAvatarSrc}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-amber-950/30">
                    {(user.fullName?.trim().charAt(0) || '?').toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  aria-label="Choose profile photo"
                  onChange={(e) => {
                    setProfileErr(null);
                    setProfileOk(null);
                    const f = e.target.files?.[0];
                    setPhotoFile(f ?? null);
                    if (f) setPendingRemovePhoto(false);
                  }}
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={savingProfile}
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-full bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
                  >
                    Choose photo
                  </button>
                  {photoFile ? (
                    <button
                      type="button"
                      disabled={savingProfile}
                      onClick={() => {
                        setPhotoFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                        setProfileErr(null);
                      }}
                      className="rounded-full px-4 py-2 text-sm font-medium text-amber-950/80 ring-1 ring-amber-900/15 hover:bg-amber-50 disabled:opacity-40"
                    >
                      Clear selection
                    </button>
                  ) : null}
                  {user.profilePhotoUrl && !pendingRemovePhoto ? (
                    <button
                      type="button"
                      disabled={savingProfile}
                      onClick={() => {
                        setPendingRemovePhoto(true);
                        setPhotoFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                        setProfileErr(null);
                        setProfileOk(null);
                      }}
                      className="rounded-full px-4 py-2 text-sm font-semibold text-rose-800 ring-1 ring-rose-200 hover:bg-rose-50 disabled:opacity-40"
                    >
                      Remove photo
                    </button>
                  ) : pendingRemovePhoto && !photoFile ? (
                    <button
                      type="button"
                      disabled={savingProfile}
                      onClick={() => {
                        setPendingRemovePhoto(false);
                        setProfileErr(null);
                      }}
                      className="rounded-full px-4 py-2 text-sm font-medium text-amber-950/80 ring-1 ring-amber-900/15 hover:bg-amber-50 disabled:opacity-40"
                    >
                      Undo remove
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2 border-t border-amber-900/10 pt-8">
            <label className="block text-sm font-medium text-amber-950" htmlFor="profile-full-name">
              Name
            </label>
            <input
              id="profile-full-name"
              name="fullName"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setProfileOk(null);
                setProfileErr(null);
              }}
              minLength={1}
              maxLength={120}
              autoComplete="name"
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-3 border-t border-amber-900/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="submit"
              disabled={savingProfile}
              className="rounded-full bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
            >
              {savingProfile ? 'Saving…' : 'Save changes'}
            </button>
            {profileErr ? <p className="text-sm text-red-700 sm:text-right">{profileErr}</p> : null}
            {profileOk && !profileErr ? (
              <p className="text-sm text-teal-800 sm:ml-auto sm:text-right">{profileOk}</p>
            ) : null}
          </div>
        </form>

        <p>
          <span className="text-sm font-medium text-amber-950/60">Email</span>
          <br />
          <span className="text-lg text-amber-950">{user.email}</span>
        </p>

        <div className="border-t border-amber-900/10 pt-6">
          <h2 className="text-sm font-semibold text-amber-950">Password</h2>
          <p className="mt-1 text-xs text-amber-950/65">Update your password in a secure dialog.</p>
          <button
            type="button"
            onClick={() => setPasswordModalOpen(true)}
            className="mt-3 rounded-full bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
          >
            Change password
          </button>
        </div>

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

      {passwordModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closePasswordModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="password-modal-title"
            className="w-full max-w-md rounded-2xl border border-amber-900/10 bg-white p-6 shadow-xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h2 id="password-modal-title" className="text-lg font-bold text-amber-950">
              Change password
            </h2>
            <form onSubmit={(e) => void onSavePassword(e)} className="mt-5 space-y-3">
              <label className="block text-sm font-medium text-amber-950" htmlFor="modal-current-password">
                Current password
              </label>
              <input
                id="modal-current-password"
                name="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  setPwErr(null);
                }}
                autoComplete="current-password"
                className={inputClass}
              />
              <label className="block text-sm font-medium text-amber-950" htmlFor="modal-new-password">
                New password
              </label>
              <input
                id="modal-new-password"
                name="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setPwErr(null);
                }}
                minLength={8}
                autoComplete="new-password"
                className={inputClass}
              />
              <label className="block text-sm font-medium text-amber-950" htmlFor="modal-confirm-password">
                Confirm new password
              </label>
              <input
                id="modal-confirm-password"
                name="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setPwErr(null);
                }}
                minLength={8}
                autoComplete="new-password"
                className={inputClass}
              />
              {pwErr ? <p className="text-sm text-red-700">{pwErr}</p> : null}
              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closePasswordModal}
                  disabled={savingPw}
                  className="rounded-full px-4 py-2 text-sm font-semibold text-amber-950 ring-1 ring-amber-900/20 hover:bg-amber-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPw}
                  className="rounded-full bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
                >
                  {savingPw ? 'Updating…' : 'Update password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
