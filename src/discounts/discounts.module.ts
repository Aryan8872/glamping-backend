import { Module } from '@nestjs/common';
import { DiscountsService } from './discounts.service.js';
import { DiscountsController } from './discounts.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [DiscountsController],
  providers: [DiscountsService],
  exports: [DiscountsService],
})
export class DiscountsModule {}
