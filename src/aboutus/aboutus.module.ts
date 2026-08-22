import { Module } from '@nestjs/common';
import { AboutUsService } from './aboutus.service.js';
import { AboutUsController } from './aboutus.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [AboutUsController],
  providers: [AboutUsService],
  exports: [AboutUsService],
})
export class AboutUsModule {}
