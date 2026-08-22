import { Module } from '@nestjs/common';
import { DestinationsService } from './destinations.service.js';
import { DestinationsController } from './destinations.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [DestinationsController],
  providers: [DestinationsService],
  exports: [DestinationsService],
})
export class DestinationsModule {}
