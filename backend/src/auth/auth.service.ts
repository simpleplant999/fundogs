import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { User } from '@prisma/client';
import { OrganizationMemberRole, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtUserPayload } from './jwt.strategy';
import type { UpdateMeDto } from './dto/update-me.dto';

const userOrgSelect = { id: true, name: true, slug: true } as const;

type UserWithOrg = Pick<User, 'id' | 'email' | 'fullName' | 'role' | 'organizationMemberRole'> & {
  organization: { id: string; name: string; slug: string } | null;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  private sign(user: UserWithOrg) {
    const payload: JwtUserPayload = {
      sub: user.id,
      role: user.role,
      email: user.email,
    };
    return { accessToken: this.jwt.sign(payload), user: this.stripUser(user) };
  }

  private stripUser(user: UserWithOrg) {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      organization: user.organization
        ? {
            id: user.organization.id,
            name: user.organization.name,
            slug: user.organization.slug,
            memberRole:
              user.organizationMemberRole === OrganizationMemberRole.ADMIN ? 'ADMIN' : 'MEMBER',
          }
        : null,
    };
  }

  async register(
    email: string,
    password: string,
    fullName: string,
    inviteCode?: string,
  ) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Email already registered');
    let organizationId: string | undefined;
    const raw = inviteCode?.trim();
    if (raw) {
      const normalized = raw.toUpperCase();
      const org = await this.prisma.organization.findUnique({
        where: { inviteCode: normalized },
      });
      if (!org) throw new BadRequestException('Invalid organization invite code');
      organizationId = org.id;
    }
    let organizationMemberRole: OrganizationMemberRole | undefined;
    if (organizationId) {
      const memberCount = await this.prisma.user.count({
        where: { organizationId },
      });
      organizationMemberRole =
        memberCount === 0 ? OrganizationMemberRole.ADMIN : OrganizationMemberRole.MEMBER;
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        role: UserRole.USER,
        ...(organizationId
          ? { organizationId, organizationMemberRole }
          : {}),
      },
      include: { organization: { select: userOrgSelect } },
    });
    return this.sign(user as UserWithOrg);
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { organization: { select: userOrgSelect } },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    return this.sign(user as UserWithOrg);
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { organization: { select: userOrgSelect } },
    });
    if (!user) throw new UnauthorizedException();
    return this.stripUser(user as UserWithOrg);
  }

  async updateMe(userId: string, dto: UpdateMeDto) {
    const fullName = dto.fullName !== undefined ? dto.fullName.trim() : undefined;
    const newPassword = dto.newPassword?.trim();
    const hasName = fullName !== undefined && fullName.length > 0;
    const hasPw = newPassword !== undefined && newPassword.length > 0;

    if (!hasName && !hasPw) {
      throw new BadRequestException('Provide a name update and/or a new password.');
    }

    const data: { fullName?: string; passwordHash?: string } = {};
    if (hasName) data.fullName = fullName;

    if (hasPw) {
      if (!dto.currentPassword) {
        throw new BadRequestException('Current password is required to set a new password.');
      }
      const row = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { passwordHash: true },
      });
      if (!row) throw new UnauthorizedException();
      const ok = await bcrypt.compare(dto.currentPassword, row.passwordHash);
      if (!ok) throw new UnauthorizedException('Current password is incorrect.');
      data.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
      include: { organization: { select: userOrgSelect } },
    });
    return this.stripUser(user as UserWithOrg);
  }
}
