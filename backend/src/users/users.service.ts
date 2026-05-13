import { Injectable, NotFoundException } from '@nestjs/common';
import { CampaignsService } from '../campaigns/campaigns.service';
import { mapOrganizationMemberRoleToPublic } from '../common/org-member-role.util';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly campaigns: CampaignsService,
  ) {}

  /** Safe public card: no email. Campaigns use same rules as public campaign list. */
  async getPublicProfile(userId: string) {
    const u = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        profilePhotoUrl: true,
        organizationMemberRole: true,
        organization: { select: { slug: true, name: true } },
      },
    });
    if (!u) throw new NotFoundException('User not found');

    const campaigns = await this.campaigns.listPublicByAuthorId(userId);

    return {
      id: u.id,
      fullName: u.fullName,
      profilePhotoUrl: u.profilePhotoUrl || '',
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
}
