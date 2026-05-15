/** Public donor label: first name plus last-name initial (e.g. "Alex M."). */
export function donorDisplayNameFromFullName(fullName: string): string {
  const normalized = fullName.trim().replace(/\s+/g, ' ');
  if (!normalized) return '';
  const parts = normalized.split(' ');
  if (parts.length === 1) return parts[0];
  const first = parts[0];
  const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
  if (!lastInitial) return first;
  return `${first} ${lastInitial}.`;
}

export const ANONYMOUS_DONOR_DISPLAY_NAME = 'Anonymous';

export function resolveDonorDisplayName(displayName: string, donateAnonymously: boolean): string {
  if (donateAnonymously) return ANONYMOUS_DONOR_DISPLAY_NAME;
  return displayName.trim();
}

export function isDonorDisplayNameReady(displayName: string, donateAnonymously: boolean): boolean {
  return donateAnonymously || displayName.trim().length > 0;
}
