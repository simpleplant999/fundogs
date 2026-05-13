import { randomBytes } from 'crypto';

export function generateInviteCode(): string {
  return randomBytes(6).toString('hex').toUpperCase();
}

export function slugifyOrganizationName(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base.length >= 2 ? base : 'organization';
}
