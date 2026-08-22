import {
  Controller, Get, Post, Put, Delete, Param, Query, Body,
  HttpCode, HttpStatus, UseInterceptors, UploadedFiles,
  ParseIntPipe,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { DestinationsService } from './destinations.service.js';
import { processSingleFile } from '../upload/upload.utils.js';
import { Public } from '../decorators/public.decorator.js';

const destinationStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), 'uploads', 'destination');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

@Controller('destination')
export class DestinationsController {
  constructor(private readonly destinationsService: DestinationsService) {}

  @Public()
  @Get('search')
  async searchDestinations(
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('isActive') isActive?: string,
    @Query('isFeatured') isFeatured?: string,
  ) {
    const result = await this.destinationsService.searchDestinations({
      q, page: Number(page) || 1, perPage: Number(limit) || 10, isActive, isFeatured,
    });
    return { message: 'Destinations searched successfully', ...result };
  }

  @Public()
  @Get('all')
  async getAllDestinations() {
    const result = await this.destinationsService.getAllDestinations();
    return { message: 'successfully returned all active destination details', data: result };
  }

  @Public()
  @Get('all/admin')
  async getAllDestinationsAdmin() {
    const result = await this.destinationsService.getAllDestinations(true);
    return { message: 'successfully returned all destination details', data: result };
  }

  @Public()
  @Get(':identifier')
  async getDestinationByIdentifier(@Param('identifier') identifier: string) {
    let result;
    if (!isNaN(Number(identifier))) {
      result = await this.destinationsService.getDestinationById(Number(identifier));
    } else {
      result = await this.destinationsService.getDestinationBySlug(identifier);
    }
    return { message: 'successfully returned searched destination details', data: result };
  }

  @Post('new')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'imageUrl', maxCount: 1 },
      { name: 'bannerUrl', maxCount: 1 },
    ], { storage: destinationStorage }),
  )
  async createDestination(
    @UploadedFiles() files: { imageUrl?: Express.Multer.File[], bannerUrl?: Express.Multer.File[] },
    @Body() body: any,
  ) {
    const imageUrl = files?.imageUrl ? await processSingleFile(files.imageUrl[0], 'destination') : null;
    const bannerUrl = files?.bannerUrl ? await processSingleFile(files.bannerUrl[0], 'destination') : null;
    const payload = { ...body, ...(imageUrl && { imageUrl }), ...(bannerUrl && { bannerUrl }) };
    
    if (payload.isActive !== undefined) {
      payload.isActive = payload.isActive === 'true' || payload.isActive === true;
    }
    if (payload.isFeatured !== undefined) {
      payload.isFeatured = payload.isFeatured === 'true' || payload.isFeatured === true;
    }

    const destination = await this.destinationsService.createDestination(payload);
    return { message: 'successfully created destination details', data: destination };
  }

  @Put(':id')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'imageUrl', maxCount: 1 },
      { name: 'bannerUrl', maxCount: 1 },
    ], { storage: destinationStorage }),
  )
  async updateDestination(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() files: { imageUrl?: Express.Multer.File[], bannerUrl?: Express.Multer.File[] },
    @Body() body: any,
  ) {
    const imageUrl = files?.imageUrl ? await processSingleFile(files.imageUrl[0], 'destination') : null;
    const bannerUrl = files?.bannerUrl ? await processSingleFile(files.bannerUrl[0], 'destination') : null;
    const payload = { ...body, ...(imageUrl && { imageUrl }), ...(bannerUrl && { bannerUrl }) };

    if (payload.isActive !== undefined) {
      payload.isActive = payload.isActive === 'true' || payload.isActive === true;
    }
    if (payload.isFeatured !== undefined) {
      payload.isFeatured = payload.isFeatured === 'true' || payload.isFeatured === true;
    }

    const updated = await this.destinationsService.updateDestination(id, payload);
    return { message: 'successfully updated destination details', data: updated };
  }

  @Delete(':id')
  async deleteDestination(@Param('id', ParseIntPipe) id: number) {
    await this.destinationsService.deleteDestination(id);
    return { message: 'successfully deleted destination detail' };
  }
}
