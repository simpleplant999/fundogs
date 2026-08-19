import { prisma } from "../db";
import { listPublicByAuthorId } from "../campaigns/service";
import { mapOrganizationMemberRoleToPublic } from "../org-member-role";

export class UserHttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Safe public card: no email. Campaigns use same rules as public campaign list. */
export async function getPublicProfile(userId: string) {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      profilePhotoUrl: true,
      organizationMemberRole: true,
      organization: { select: { slug: true, name: true } },
    },
  });
  if (!u) throw new UserHttpError(404, "User not found");

  const campaigns = await listPublicByAuthorId(userId);

  return {
    id: u.id,
    fullName: u.fullName,
    profilePhotoUrl: u.profilePhotoUrl || "",
    organization: u.organization
      ? {
          slug: u.organization.slug,
          name: u.organization.name,
          memberRole: mapOrganizationMemberRoleToPublic(u.organizationMemberRole),
        }
      : null,
    campaigns,
  };
}
