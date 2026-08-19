import {
  WithdrawalRequestStatus,
  type Campaign,
} from "@prisma/client";
import { prisma } from "../db";

export class WithdrawalHttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export type ApiCampaignBankAccount = {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  updatedAt: string;
};

export type ApiWithdrawalRequest = {
  id: string;
  campaignId: string;
  amount: number;
  status: string;
  adminNote: string;
  createdAt: string;
  updatedAt: string;
};

export type ApiWithdrawalSummary = {
  raisedAmount: number;
  withdrawnAmount: number;
  pendingWithdrawalAmount: number;
  availableBalance: number;
};

const OPEN_WITHDRAWAL_STATUSES: WithdrawalRequestStatus[] = [
  WithdrawalRequestStatus.REQUESTED,
  WithdrawalRequestStatus.APPROVED,
];

function mapCampaignBankAccount(row: {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  updatedAt: Date;
}): ApiCampaignBankAccount {
  return {
    accountHolderName: row.accountHolderName,
    bankName: row.bankName,
    accountNumber: row.accountNumber,
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapWithdrawalRequest(row: {
  id: string;
  campaignId: string;
  amount: number;
  status: WithdrawalRequestStatus;
  adminNote: string;
  createdAt: Date;
  updatedAt: Date;
}): ApiWithdrawalRequest {
  return {
    id: row.id,
    campaignId: row.campaignId,
    amount: row.amount,
    status: row.status,
    adminNote: row.adminNote,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function getOwnedCampaign(campaignId: string, userId: string): Promise<Campaign> {
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign) throw new WithdrawalHttpError(404, "Campaign not found");
  if (campaign.authorId !== userId) throw new WithdrawalHttpError(403, "Not your campaign");
  return campaign;
}

async function getPendingWithdrawalAmount(campaignId: string): Promise<number> {
  const rows = await prisma.withdrawalRequest.findMany({
    where: {
      campaignId,
      status: { in: OPEN_WITHDRAWAL_STATUSES },
    },
    select: { amount: true },
  });
  return rows.reduce((sum, r) => sum + r.amount, 0);
}

function buildSummary(campaign: Campaign, pendingWithdrawalAmount: number): ApiWithdrawalSummary {
  const availableBalance = Math.max(
    0,
    campaign.raisedAmount - campaign.withdrawnAmount - pendingWithdrawalAmount,
  );
  return {
    raisedAmount: campaign.raisedAmount,
    withdrawnAmount: campaign.withdrawnAmount,
    pendingWithdrawalAmount,
    availableBalance,
  };
}

export async function getCreatorBankAccount(
  userId: string,
  campaignId: string,
): Promise<ApiCampaignBankAccount | null> {
  await getOwnedCampaign(campaignId, userId);
  const row = await prisma.campaignBankAccount.findUnique({ where: { campaignId } });
  return row ? mapCampaignBankAccount(row) : null;
}

export async function upsertCreatorBankAccount(
  userId: string,
  campaignId: string,
  dto: { accountHolderName: string; bankName: string; accountNumber: string },
): Promise<ApiCampaignBankAccount> {
  await getOwnedCampaign(campaignId, userId);
  const row = await prisma.campaignBankAccount.upsert({
    where: { campaignId },
    create: {
      campaignId,
      accountHolderName: dto.accountHolderName.trim(),
      bankName: dto.bankName.trim(),
      accountNumber: dto.accountNumber.trim(),
    },
    update: {
      accountHolderName: dto.accountHolderName.trim(),
      bankName: dto.bankName.trim(),
      accountNumber: dto.accountNumber.trim(),
    },
  });
  return mapCampaignBankAccount(row);
}

export async function listCreatorWithdrawals(
  userId: string,
  campaignId: string,
): Promise<{ summary: ApiWithdrawalSummary; requests: ApiWithdrawalRequest[] }> {
  const campaign = await getOwnedCampaign(campaignId, userId);
  const pendingWithdrawalAmount = await getPendingWithdrawalAmount(campaignId);
  const requests = await prisma.withdrawalRequest.findMany({
    where: { campaignId },
    orderBy: { createdAt: "desc" },
  });
  return {
    summary: buildSummary(campaign, pendingWithdrawalAmount),
    requests: requests.map(mapWithdrawalRequest),
  };
}

export async function createCreatorWithdrawal(
  userId: string,
  campaignId: string,
  dto: { amount: number },
): Promise<ApiWithdrawalRequest> {
  const campaign = await getOwnedCampaign(campaignId, userId);
  const bankAccount = await prisma.campaignBankAccount.findUnique({ where: { campaignId } });
  if (!bankAccount) {
    throw new WithdrawalHttpError(400, "Add your bank account before requesting a withdrawal.");
  }

  const amount = Math.round(dto.amount);
  if (!Number.isFinite(amount) || amount < 1) {
    throw new WithdrawalHttpError(400, "Enter a valid withdrawal amount.");
  }

  const pendingWithdrawalAmount = await getPendingWithdrawalAmount(campaignId);
  const availableBalance =
    campaign.raisedAmount - campaign.withdrawnAmount - pendingWithdrawalAmount;
  if (amount > availableBalance) {
    throw new WithdrawalHttpError(400, "Withdrawal amount exceeds the available campaign balance.");
  }

  const row = await prisma.withdrawalRequest.create({
    data: {
      campaignId,
      requestedById: userId,
      amount,
      status: WithdrawalRequestStatus.REQUESTED,
    },
  });
  return mapWithdrawalRequest(row);
}

export type ApiAdminWithdrawalRequest = ApiWithdrawalRequest & {
  campaign: {
    id: string;
    slug: string;
    title: string;
    raisedAmount: number;
    withdrawnAmount: number;
  };
  requestedBy: {
    id: string;
    fullName: string;
    email: string;
  };
  bankAccount: ApiCampaignBankAccount | null;
};

const ADMIN_WITHDRAWAL_INCLUDE = {
  requestedBy: { select: { id: true, fullName: true, email: true } },
  campaign: {
    select: {
      id: true,
      slug: true,
      title: true,
      raisedAmount: true,
      withdrawnAmount: true,
      bankAccount: true,
    },
  },
} as const;

function mapAdminWithdrawalRequest(row: {
  id: string;
  campaignId: string;
  amount: number;
  status: WithdrawalRequestStatus;
  adminNote: string;
  createdAt: Date;
  updatedAt: Date;
  requestedBy: { id: string; fullName: string; email: string };
  campaign: {
    id: string;
    slug: string;
    title: string;
    raisedAmount: number;
    withdrawnAmount: number;
    bankAccount: {
      accountHolderName: string;
      bankName: string;
      accountNumber: string;
      updatedAt: Date;
    } | null;
  };
}): ApiAdminWithdrawalRequest {
  return {
    ...mapWithdrawalRequest(row),
    campaign: {
      id: row.campaign.id,
      slug: row.campaign.slug,
      title: row.campaign.title,
      raisedAmount: row.campaign.raisedAmount,
      withdrawnAmount: row.campaign.withdrawnAmount,
    },
    requestedBy: {
      id: row.requestedBy.id,
      fullName: row.requestedBy.fullName,
      email: row.requestedBy.email,
    },
    bankAccount: row.campaign.bankAccount
      ? mapCampaignBankAccount(row.campaign.bankAccount)
      : null,
  };
}

export async function listAdminWithdrawals(): Promise<ApiAdminWithdrawalRequest[]> {
  const rows = await prisma.withdrawalRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: ADMIN_WITHDRAWAL_INCLUDE,
  });
  return rows.map(mapAdminWithdrawalRequest);
}

export async function updateAdminWithdrawal(
  requestId: string,
  dto: { status: WithdrawalRequestStatus; adminNote?: string },
): Promise<ApiAdminWithdrawalRequest> {
  const existing = await prisma.withdrawalRequest.findUnique({
    where: { id: requestId },
    include: {
      campaign: true,
      requestedBy: { select: { id: true, fullName: true, email: true } },
    },
  });
  if (!existing) throw new WithdrawalHttpError(404, "Withdrawal request not found");

  const nextStatus = dto.status;
  const currentStatus = existing.status;
  if (
    currentStatus === WithdrawalRequestStatus.PAID ||
    currentStatus === WithdrawalRequestStatus.REJECTED
  ) {
    throw new WithdrawalHttpError(400, "This withdrawal request is already finalized.");
  }

  if (nextStatus === WithdrawalRequestStatus.PAID) {
    const pendingOthersRows = await prisma.withdrawalRequest.findMany({
      where: {
        campaignId: existing.campaignId,
        status: { in: OPEN_WITHDRAWAL_STATUSES },
        id: { not: existing.id },
      },
      select: { amount: true },
    });
    const pendingOthersAmount = pendingOthersRows.reduce((sum, r) => sum + r.amount, 0);
    const availableBalance =
      existing.campaign.raisedAmount - existing.campaign.withdrawnAmount - pendingOthersAmount;
    if (existing.amount > availableBalance) {
      throw new WithdrawalHttpError(
        400,
        "Cannot mark paid: amount exceeds the campaign available balance.",
      );
    }

    await prisma.withdrawalRequest.update({
      where: { id: requestId },
      data: {
        status: WithdrawalRequestStatus.PAID,
        adminNote: dto.adminNote?.trim() ?? existing.adminNote,
      },
    });
    await prisma.campaign.update({
      where: { id: existing.campaignId },
      data: { withdrawnAmount: { increment: existing.amount } },
    });

    const full = await prisma.withdrawalRequest.findUniqueOrThrow({
      where: { id: requestId },
      include: ADMIN_WITHDRAWAL_INCLUDE,
    });
    return mapAdminWithdrawalRequest(full);
  }

  if (
    nextStatus !== WithdrawalRequestStatus.APPROVED &&
    nextStatus !== WithdrawalRequestStatus.REJECTED &&
    nextStatus !== WithdrawalRequestStatus.REQUESTED
  ) {
    throw new WithdrawalHttpError(400, "Unsupported withdrawal status update.");
  }

  const updated = await prisma.withdrawalRequest.update({
    where: { id: requestId },
    data: {
      status: nextStatus,
      adminNote: dto.adminNote?.trim() ?? existing.adminNote,
    },
    include: ADMIN_WITHDRAWAL_INCLUDE,
  });
  return mapAdminWithdrawalRequest(updated);
}

export async function getAdminCampaignBankAccount(
  campaignId: string,
): Promise<ApiCampaignBankAccount | null> {
  const row = await prisma.campaignBankAccount.findUnique({ where: { campaignId } });
  return row ? mapCampaignBankAccount(row) : null;
}
