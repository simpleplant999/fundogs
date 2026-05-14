import type { Campaign, CampaignBankAccount, User, WithdrawalRequest } from '@prisma/client';

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

export function mapCampaignBankAccount(row: CampaignBankAccount): ApiCampaignBankAccount {
  return {
    accountHolderName: row.accountHolderName,
    bankName: row.bankName,
    accountNumber: row.accountNumber,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function mapWithdrawalRequest(row: WithdrawalRequest): ApiWithdrawalRequest {
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

export function mapAdminWithdrawalRequest(
  row: WithdrawalRequest & {
    campaign: Pick<Campaign, 'id' | 'slug' | 'title' | 'raisedAmount' | 'withdrawnAmount'> & {
      bankAccount: CampaignBankAccount | null;
    };
    requestedBy: Pick<User, 'id' | 'fullName' | 'email'>;
  },
): ApiAdminWithdrawalRequest {
  const { campaign, requestedBy, ...request } = row;
  return {
    ...mapWithdrawalRequest(request),
    campaign: {
      id: campaign.id,
      slug: campaign.slug,
      title: campaign.title,
      raisedAmount: campaign.raisedAmount,
      withdrawnAmount: campaign.withdrawnAmount,
    },
    requestedBy: {
      id: requestedBy.id,
      fullName: requestedBy.fullName,
      email: requestedBy.email,
    },
    bankAccount: campaign.bankAccount ? mapCampaignBankAccount(campaign.bankAccount) : null,
  };
}
