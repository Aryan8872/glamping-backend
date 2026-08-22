import { Module } from '@nestjs/common';
import { GalleryService } from './gallery.service.js';
import { GalleryController } from './gallery.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [GalleryController],
  providers: [GalleryService],
  exports: [GalleryService],
})
export class GalleryModule {}
