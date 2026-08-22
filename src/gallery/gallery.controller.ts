import {
  Controller, Get, Post, Put, Patch, Delete, Param, Body,
  HttpCode, HttpStatus, UseInterceptors, UploadedFiles,
  ParseIntPipe,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { GalleryService } from './gallery.service.js';
import { processSingleFile, processUploadedFiles, safeParseArray } from '../upload/upload.utils.js';
import { Public } from '../decorators/public.decorator.js';

const galleryStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), 'uploads', 'gallery');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

@Controller('gallery')
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  @Post('new')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'coverImage', maxCount: 1 },
      { name: 'galleryImage', maxCount: 10 },
    ], { storage: galleryStorage }),
  )
  async createGallery(
    @UploadedFiles() files: { coverImage?: Express.Multer.File[], galleryImage?: Express.Multer.File[] },
    @Body() body: any,
  ) {
    const coverImage = files?.coverImage ? await processSingleFile(files.coverImage[0], 'gallery') : null;
    const galleryImage = files?.galleryImage ? await processUploadedFiles(files.galleryImage, 'gallery') : [];

    const payload = { ...body, ...(coverImage && { coverImage }), images: galleryImage };
    const gallery = await this.galleryService.createGalleryService(payload);
    return { message: 'successfully created gallery details', data: gallery };
  }

  @Public()
  @Get('all')
  async getAllGallery() {
    const gallery = await this.galleryService.getGalleryService();
    return { message: 'successfully returned all gallery items', data: gallery };
  }

  @Public()
  @Get(':slug')
  async getGalleryBySlug(@Param('slug') slug: string) {
    const gallery = await this.galleryService.getGalleryBySlugService(slug);
    if (!gallery) return { message: 'Gallery not found' };
    return { message: 'successfully returned searched gallery item', data: gallery };
  }

  @Put(':slug')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'coverImage', maxCount: 1 },
      { name: 'galleryImage', maxCount: 10 },
    ], { storage: galleryStorage }),
  )
  async updateGallery(
    @Param('slug') slug: string,
    @UploadedFiles() files: { coverImage?: Express.Multer.File[], galleryImage?: Express.Multer.File[] },
    @Body() body: any,
  ) {
    const coverImage = files?.coverImage ? await processSingleFile(files.coverImage[0], 'gallery') : null;
    const galleryImage = files?.galleryImage ? await processUploadedFiles(files.galleryImage, 'gallery') : [];

    const removedImages = safeParseArray(body.removedImages);
    const images = safeParseArray(body.images);

    const updateData = {
      ...body,
      removedImages, images, newImages: galleryImage,
      ...(coverImage && { coverImage }),
    };

    const updated = await this.galleryService.updateGalleryService(slug, updateData);
    return { message: 'successfully updated gallery details', data: updated };
  }

  @Patch(':slug/:status')
  async updateGalleryStatus(
    @Param('slug') slug: string,
    @Param('status') status: string,
  ) {
    const updated = await this.galleryService.updateGalleryStatusService(slug, status);
    if (!updated) return { message: 'invalid status' };
    return { message: 'successfully updated gallery details', data: updated };
  }

  @Delete(':galleryId')
  async deleteGallery(@Param('galleryId', ParseIntPipe) galleryId: number) {
    await this.galleryService.deleteGalleryService(galleryId);
    return { message: 'successfully deleted gallery detail' };
  }
}
