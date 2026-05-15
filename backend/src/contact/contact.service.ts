import { Injectable, Logger } from '@nestjs/common';
import { ContactMessageCategory } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(private readonly prisma: PrismaService) {}

  async submit(dto: CreateContactMessageDto) {
    const row = await this.prisma.contactMessage.create({
      data: {
        name: dto.name.trim(),
        email: dto.email.trim().toLowerCase(),
        category: dto.category as ContactMessageCategory,
        message: dto.message.trim(),
      },
      select: { id: true, createdAt: true },
    });
    this.logger.log(`Contact message ${row.id} (${dto.category}) from ${dto.email}`);
    return { ok: true as const, id: row.id, createdAt: row.createdAt };
  }
}
