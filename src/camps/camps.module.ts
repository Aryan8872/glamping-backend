import { Module } from '@nestjs/common';
import { CampsService } from './camps.service.js';
import { CampsController } from './camps.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [CampsController],
  providers: [CampsService],
  exports: [CampsService],
})
export class CampsModule {}
