import {
  Controller, Get, Post, Patch, Delete, Param, Query, Body,
  HttpCode, HttpStatus, UseInterceptors, UploadedFiles,
  ParseIntPipe, UsePipes,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { CampsService } from './camps.service.js';
import { processUploadedFiles, safeParseArray } from '../upload/upload.utils.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { createCampSchema, updateCampSchema, searchCampSchema } from './camps.schemas.js';
import { Public } from '../decorators/public.decorator.js';

const campStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), 'uploads', 'campsite');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

@Controller('campsite')
export class CampsController {
  constructor(private readonly campsService: CampsService) {}

  @Post('new')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'campImages', maxCount: 10 }], { storage: campStorage }),
  )
  async createCamp(
    @UploadedFiles() files: { campImages?: Express.Multer.File[] },
    @Body() body: any,
  ) {
    const campImages = files?.campImages
      ? await processUploadedFiles(files.campImages, 'campsite')
      : [];

    const facilities = safeParseArray(body.facilities);
    const adventureIds = safeParseArray(body.adventureIds);
    const newFacilities = safeParseArray(body.newFacilities);
    const experienceIds = safeParseArray(body.experienceIds);

    const payload = {
      ...body,
      hostId: body.hostId ? Number(body.hostId) : null,
      images: campImages,
      facilities,
      adventureIds,
      newFacilities,
      experienceIds,
      maxAdult: body.maxAdult ? Number(body.maxAdult) : 0,
      maxChildren: body.maxChildren ? Number(body.maxChildren) : 0,
      maxPets: body.maxPets ? Number(body.maxPets) : 0,
      isFeatured: body.isFeatured === 'true' || body.isFeatured === true,
    };

    const newCamp = await this.campsService.createCampSite(payload);
    return { message: 'CampSite created successfully', data: newCamp };
  }

  @Public()
  @Get('all')
  async getAllCamps(
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('destination') destination?: string,
    @Query('experience') experience?: string,
    @Query('isFeatured') isFeatured?: string,
  ) {
    const result = await this.campsService.searchCamp({
      q,
      page: Number(page) || 1,
      perPage: Number(limit) || 15,
      destination,
      experience,
      isFeatured: isFeatured !== undefined ? (isFeatured === 'true') : undefined,
      ignoreAvailability: true,
    });

    return {
      message: 'CampSites fetched successfully',
      data: result.results,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      hasMore: result.hasMore,
    };
  }

  @Public()
  @Get('search')
  async searchCamps(@Query() query: any) {
    let facilityIds: number[] = [];
    if (query.facilityIds) {
      if (Array.isArray(query.facilityIds)) {
        facilityIds = query.facilityIds.map(Number);
      } else if (typeof query.facilityIds === 'string') {
        facilityIds = query.facilityIds.split(',').filter(Boolean).map(Number);
      }
    }

    const options = {
      q: query.q,
      page: Number(query.page || 1),
      perPage: Number(query.limit || 12),
      minPrice: query.minPrice ? Number(query.minPrice) : undefined,
      maxPrice: query.maxPrice ? Number(query.maxPrice) : undefined,
      facilityIds,
      checkIn: query.checkIn,
      checkOut: query.checkOut,
      adults: Number(query.adults || 1),
      children: Number(query.children || 0),
      pets: Number(query.pets || 0),
      sort: query.sort || 'relevance',
      experience: query.experience,
      destination: query.destination,
      isFeatured: query.isFeatured !== undefined ? (query.isFeatured === 'true') : undefined,
    };

    const result = await this.campsService.searchCamp(options);

    return {
      message: 'searched campsite successfully',
      data: result.results ?? [],
      total: result.total ?? 0,
      page: result.page ?? 1,
      limit: result.limit ?? options.perPage,
      totalPages: result.totalPages ?? 0,
      hasMore: result.hasMore ?? false,
    };
  }

  @Public()
  @Get(':id')
  async getCampById(@Param('id', ParseIntPipe) id: number) {
    const camp = await this.campsService.getCampSiteById(id);
    if (!camp) {
      return { message: 'CampSite not found' };
    }
    return { message: 'CampSite found', data: camp };
  }

  @Patch(':id')
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'campImages', maxCount: 10 }], { storage: campStorage }),
  )
  async updateCamp(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() files: { campImages?: Express.Multer.File[] },
    @Body() body: any,
  ) {
    const removedImages = safeParseArray(body.removedImages);
    const images = safeParseArray(body.images);
    const newFacilities = safeParseArray(body.newFacilities);
    const newImages = files?.campImages
      ? await processUploadedFiles(files.campImages, 'campsite')
      : [];
    const facilities = safeParseArray(body.facilities);

    const payload: any = {
      ...body,
      hostId: body.hostId !== undefined
        ? (body.hostId === '' ? null : Number(body.hostId))
        : undefined,
      removedImages, images, newFacilities, newImages, facilities,
      maxAdult: body.maxAdult !== undefined ? Number(body.maxAdult) : undefined,
      maxChildren: body.maxChildren !== undefined ? Number(body.maxChildren) : undefined,
      maxPets: body.maxPets !== undefined ? Number(body.maxPets) : undefined,
      isFeatured: body.isFeatured !== undefined ? String(body.isFeatured) === 'true' : undefined,
      pricePerNight: body.pricePerNight !== undefined ? Number(body.pricePerNight) : undefined,
      destinationId: body.destinationId !== undefined
        ? (body.destinationId === '' ? null : Number(body.destinationId))
        : undefined,
    };

    const camp = await this.campsService.updateCampSite(id, payload);
    return { message: 'CampSite updated successfully', data: camp };
  }

  @Delete(':id')
  async deleteCamp(@Param('id', ParseIntPipe) id: number) {
    await this.campsService.deleteCampSite(id);
    return { message: 'CampSite deleted successfully' };
  }
}
