import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AuthModule } from '../auth/auth.module';
import { WithdrawalsModule } from '../withdrawals/withdrawals.module';

@Module({
  imports: [AuthModule, WithdrawalsModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
