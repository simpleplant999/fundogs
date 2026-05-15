import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { AdminModule } from './admin/admin.module';
import { PaymentsModule } from './payments/payments.module';
import { WithdrawalsModule } from './withdrawals/withdrawals.module';

import { OrganizationsModule } from './organizations/organizations.module';
import { UsersModule } from './users/users.module';
import { SupportModule } from './support/support.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    PaymentsModule,
    CampaignsModule,
    AdminModule,
    WithdrawalsModule,
    OrganizationsModule,
    UsersModule,
    SupportModule,
  ],
})
export class AppModule {}
