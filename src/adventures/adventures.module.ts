import { Module } from '@nestjs/common';
import { AdventuresService } from './adventures.service.js';
import { AdventuresController } from './adventures.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [AdventuresController],
  providers: [AdventuresService],
  exports: [AdventuresService],
})
export class AdventuresModule {}
