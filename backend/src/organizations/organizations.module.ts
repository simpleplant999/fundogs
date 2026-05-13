import { Module } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import {
  OrganizationMembershipController,
  OrganizationsController,
} from './organizations.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [OrganizationsController, OrganizationMembershipController],
  providers: [OrganizationsService],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
