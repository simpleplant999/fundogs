import { OrganizationMemberRole } from '@prisma/client';

/** Map DB org role to public API strings (handles null and string edge cases). */
export function mapOrganizationMemberRoleToPublic(
  role: OrganizationMemberRole | string | null | undefined,
): 'ADMIN' | 'MEMBER' {
  if (role == null) return 'MEMBER';
  if (role === OrganizationMemberRole.ADMIN) return 'ADMIN';
  const s = String(role).toUpperCase();
  return s === 'ADMIN' ? 'ADMIN' : 'MEMBER';
}
