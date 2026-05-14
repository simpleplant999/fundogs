import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Campaign,
  WithdrawalRequestStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWithdrawalRequestDto } from './dto/create-withdrawal-request.dto';
import { UpdateWithdrawalRequestDto } from './dto/update-withdrawal-request.dto';
import { UpsertCampaignBankAccountDto } from './dto/upsert-campaign-bank-account.dto';
import {
  ApiAdminWithdrawalRequest,
  ApiCampaignBankAccount,
  ApiWithdrawalRequest,
  ApiWithdrawalSummary,
  mapAdminWithdrawalRequest,
  mapCampaignBankAccount,
  mapWithdrawalRequest,
} from './withdrawals.mapper';

const OPEN_WITHDRAWAL_STATUSES: WithdrawalRequestStatus[] = [
  WithdrawalRequestStatus.REQUESTED,
  WithdrawalRequestStatus.APPROVED,
];

@Injectable()
export class WithdrawalsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getOwnedCampaign(campaignId: string, userId: string): Promise<Campaign> {
    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found');
    if (campaign.authorId !== userId) throw new ForbiddenException('Not your campaign');
    return campaign;
  }

  private async getPendingWithdrawalAmount(campaignId: string): Promise<number> {
    const agg = await this.prisma.withdrawalRequest.aggregate({
      where: {
        campaignId,
        status: { in: OPEN_WITHDRAWAL_STATUSES },
      },
      _sum: { amount: true },
    });
    return agg._sum.amount ?? 0;
  }

  private buildSummary(campaign: Campaign, pendingWithdrawalAmount: number): ApiWithdrawalSummary {
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

  async getCreatorBankAccount(
    userId: string,
    campaignId: string,
  ): Promise<ApiCampaignBankAccount | null> {
    await this.getOwnedCampaign(campaignId, userId);
    const row = await this.prisma.campaignBankAccount.findUnique({ where: { campaignId } });
    return row ? mapCampaignBankAccount(row) : null;
  }

  async upsertCreatorBankAccount(
    userId: string,
    campaignId: string,
    dto: UpsertCampaignBankAccountDto,
  ): Promise<ApiCampaignBankAccount> {
    await this.getOwnedCampaign(campaignId, userId);
    const row = await this.prisma.campaignBankAccount.upsert({
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

  async listCreatorWithdrawals(
    userId: string,
    campaignId: string,
  ): Promise<{ summary: ApiWithdrawalSummary; requests: ApiWithdrawalRequest[] }> {
    const campaign = await this.getOwnedCampaign(campaignId, userId);
    const pendingWithdrawalAmount = await this.getPendingWithdrawalAmount(campaignId);
    const requests = await this.prisma.withdrawalRequest.findMany({
      where: { campaignId },
      orderBy: { createdAt: 'desc' },
    });
    return {
      summary: this.buildSummary(campaign, pendingWithdrawalAmount),
      requests: requests.map(mapWithdrawalRequest),
    };
  }

  async createCreatorWithdrawal(
    userId: string,
    campaignId: string,
    dto: CreateWithdrawalRequestDto,
  ): Promise<ApiWithdrawalRequest> {
    const campaign = await this.getOwnedCampaign(campaignId, userId);
    const bankAccount = await this.prisma.campaignBankAccount.findUnique({ where: { campaignId } });
    if (!bankAccount) {
      throw new BadRequestException('Add your bank account before requesting a withdrawal.');
    }

    const amount = Math.round(dto.amount);
    if (!Number.isFinite(amount) || amount < 1) {
      throw new BadRequestException('Enter a valid withdrawal amount.');
    }

    const pendingWithdrawalAmount = await this.getPendingWithdrawalAmount(campaignId);
    const availableBalance = campaign.raisedAmount - campaign.withdrawnAmount - pendingWithdrawalAmount;
    if (amount > availableBalance) {
      throw new BadRequestException('Withdrawal amount exceeds the available campaign balance.');
    }

    const row = await this.prisma.withdrawalRequest.create({
      data: {
        campaignId,
        requestedById: userId,
        amount,
        status: WithdrawalRequestStatus.REQUESTED,
      },
    });
    return mapWithdrawalRequest(row);
  }

  async listAdminWithdrawals(): Promise<ApiAdminWithdrawalRequest[]> {
    const rows = await this.prisma.withdrawalRequest.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
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
      },
    });
    return rows.map((row) => mapAdminWithdrawalRequest(row));
  }

  async updateAdminWithdrawal(
    requestId: string,
    dto: UpdateWithdrawalRequestDto,
  ): Promise<ApiAdminWithdrawalRequest> {
    const existing = await this.prisma.withdrawalRequest.findUnique({
      where: { id: requestId },
      include: {
        campaign: true,
        requestedBy: { select: { id: true, fullName: true, email: true } },
      },
    });
    if (!existing) throw new NotFoundException('Withdrawal request not found');

    const nextStatus = dto.status;
    const currentStatus = existing.status;
    if (currentStatus === WithdrawalRequestStatus.PAID || currentStatus === WithdrawalRequestStatus.REJECTED) {
      throw new BadRequestException('This withdrawal request is already finalized.');
    }

    if (nextStatus === WithdrawalRequestStatus.PAID) {
      const pendingOthers = await this.prisma.withdrawalRequest.aggregate({
        where: {
          campaignId: existing.campaignId,
          status: { in: OPEN_WITHDRAWAL_STATUSES },
          id: { not: existing.id },
        },
        _sum: { amount: true },
      });
      const pendingOthersAmount = pendingOthers._sum.amount ?? 0;
      const availableBalance =
        existing.campaign.raisedAmount - existing.campaign.withdrawnAmount - pendingOthersAmount;
      if (existing.amount > availableBalance) {
        throw new BadRequestException('Cannot mark paid: amount exceeds the campaign available balance.');
      }

      const updated = await this.prisma.$transaction(async (tx) => {
        const request = await tx.withdrawalRequest.update({
          where: { id: requestId },
          data: {
            status: WithdrawalRequestStatus.PAID,
            adminNote: dto.adminNote?.trim() ?? existing.adminNote,
          },
        });
        await tx.campaign.update({
          where: { id: existing.campaignId },
          data: { withdrawnAmount: { increment: existing.amount } },
        });
        return request;
      });

      const full = await this.prisma.withdrawalRequest.findUniqueOrThrow({
        where: { id: updated.id },
        include: {
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
        },
      });
      return mapAdminWithdrawalRequest(full);
    }

    if (
      nextStatus !== WithdrawalRequestStatus.APPROVED &&
      nextStatus !== WithdrawalRequestStatus.REJECTED &&
      nextStatus !== WithdrawalRequestStatus.REQUESTED
    ) {
      throw new BadRequestException('Unsupported withdrawal status update.');
    }

    const updated = await this.prisma.withdrawalRequest.update({
      where: { id: requestId },
      data: {
        status: nextStatus,
        adminNote: dto.adminNote?.trim() ?? existing.adminNote,
      },
      include: {
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
      },
    });
    return mapAdminWithdrawalRequest(updated);
  }

  async getAdminCampaignBankAccount(campaignId: string): Promise<ApiCampaignBankAccount | null> {
    const row = await this.prisma.campaignBankAccount.findUnique({ where: { campaignId } });
    return row ? mapCampaignBankAccount(row) : null;
  }
}
