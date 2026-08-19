import * as bcrypt from "bcrypt";
import {
  OrganizationMemberRole,
  UserRole,
  type User,
} from "@prisma/client";
import { prisma } from "../db";
import { signAccessToken, type JwtUserPayload } from "./jwt";
import { mapOrganizationMemberRoleToPublic } from "../org-member-role";

const userOrgSelect = { id: true, name: true, slug: true } as const;

type UserWithOrg = Pick<
  User,
  "id" | "email" | "fullName" | "role" | "organizationMemberRole" | "profilePhotoUrl"
> & {
  organization: { id: string; name: string; slug: string } | null;
};

export class AuthHttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

function stripUser(user: UserWithOrg) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    profilePhotoUrl: user.profilePhotoUrl ?? "",
    role: user.role,
    organization: user.organization
      ? {
          id: user.organization.id,
          name: user.organization.name,
          slug: user.organization.slug,
          memberRole: mapOrganizationMemberRoleToPublic(user.organizationMemberRole),
        }
      : null,
  };
}

async function sign(user: UserWithOrg) {
  const payload: JwtUserPayload = {
    sub: user.id,
    role: user.role,
    email: user.email,
  };
  return { accessToken: await signAccessToken(payload), user: stripUser(user) };
}

export async function register(
  email: string,
  password: string,
  fullName: string,
  inviteCode?: string,
) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AuthHttpError(409, "Email already registered");

  let organizationId: string | undefined;
  const raw = inviteCode?.trim();
  if (raw) {
    const org = await prisma.organization.findUnique({
      where: { inviteCode: raw.toUpperCase() },
    });
    if (!org) throw new AuthHttpError(400, "Invalid organization invite code");
    organizationId = org.id;
  }

  let organizationMemberRole: OrganizationMemberRole | undefined;
  if (organizationId) {
    const memberCount = await prisma.user.count({ where: { organizationId } });
    organizationMemberRole =
      memberCount === 0 ? OrganizationMemberRole.ADMIN : OrganizationMemberRole.MEMBER;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      fullName,
      role: UserRole.USER,
      ...(organizationId ? { organizationId, organizationMemberRole } : {}),
    },
    include: { organization: { select: userOrgSelect } },
  });
  return sign(user as UserWithOrg);
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { organization: { select: userOrgSelect } },
  });
  if (!user) throw new AuthHttpError(401, "Invalid credentials");
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new AuthHttpError(401, "Invalid credentials");
  return sign(user as UserWithOrg);
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { organization: { select: userOrgSelect } },
  });
  if (!user) throw new AuthHttpError(401, "Unauthorized");
  return stripUser(user as UserWithOrg);
}

export async function updateMe(
  userId: string,
  dto: {
    fullName?: string;
    currentPassword?: string;
    newPassword?: string;
    profilePhotoUrl?: string;
  },
) {
  const fullName = dto.fullName !== undefined ? dto.fullName.trim() : undefined;
  const newPassword = dto.newPassword?.trim();
  const hasName = fullName !== undefined && fullName.length > 0;
  const hasPw = newPassword !== undefined && newPassword.length > 0;
  const hasPhotoUpdate = dto.profilePhotoUrl !== undefined;

  if (!hasName && !hasPw && !hasPhotoUpdate) {
    throw new AuthHttpError(
      400,
      "Provide a name update, a new password, and/or a profile photo update.",
    );
  }

  const data: { fullName?: string; passwordHash?: string; profilePhotoUrl?: string } = {};
  if (hasName) data.fullName = fullName;
  if (hasPhotoUpdate) data.profilePhotoUrl = (dto.profilePhotoUrl ?? "").trim();

  if (hasPw) {
    if (!dto.currentPassword) {
      throw new AuthHttpError(400, "Current password is required to set a new password.");
    }
    const row = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });
    if (!row) throw new AuthHttpError(401, "Unauthorized");
    const ok = await bcrypt.compare(dto.currentPassword, row.passwordHash);
    if (!ok) throw new AuthHttpError(401, "Current password is incorrect.");
    data.passwordHash = await bcrypt.hash(newPassword, 10);
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    include: { organization: { select: userOrgSelect } },
  });
  return stripUser(user as UserWithOrg);
}

export async function setProfilePhotoUrl(userId: string, profilePhotoUrl: string) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { profilePhotoUrl },
    include: { organization: { select: userOrgSelect } },
  });
  return stripUser(user as UserWithOrg);
}
