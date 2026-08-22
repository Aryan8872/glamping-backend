import {
  Controller, Get, Post, Put, Delete, Param, Query, Body,
  HttpCode, HttpStatus, UseInterceptors, UploadedFiles,
  ParseIntPipe,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { ExperiencesService } from './experiences.service.js';
import { processSingleFile } from '../upload/upload.utils.js';
import { Public } from '../decorators/public.decorator.js';

const experienceStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), 'uploads', 'experience');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

@Controller('experience')
export class ExperiencesController {
  constructor(private readonly experiencesService: ExperiencesService) {}

  @Public()
  @Get('search')
  async searchExperiences(
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('isActive') isActive?: string,
    @Query('isFeatured') isFeatured?: string,
  ) {
    const result = await this.experiencesService.searchExperiences({
      q, page: Number(page) || 1, perPage: Number(limit) || 10, isActive, isFeatured,
    });
    return { message: 'Experiences searched successfully', ...result };
  }

  @Public()
  @Get('all')
  async getAllExperiences() {
    const result = await this.experiencesService.getAllExperiences();
    return { message: 'successfully returned all active experience details', data: result };
  }

  @Public()
  @Get('all/admin')
  async getAllExperiencesAdmin() {
    const result = await this.experiencesService.getAllExperiences(true);
    return { message: 'successfully returned all experience details', data: result };
  }

  @Public()
  @Get(':identifier')
  async getExperienceByIdentifier(@Param('identifier') identifier: string) {
    let result;
    if (!isNaN(Number(identifier))) {
      result = await this.experiencesService.getExperienceById(Number(identifier));
    } else {
      result = await this.experiencesService.getExperienceBySlug(identifier);
    }
    return { message: 'successfully returned searched experience details', data: result };
  }

  @Post('new')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'imageUrl', maxCount: 1 },
      { name: 'bannerUrl', maxCount: 1 },
    ], { storage: experienceStorage }),
  )
  async createExperience(
    @UploadedFiles() files: { imageUrl?: Express.Multer.File[], bannerUrl?: Express.Multer.File[] },
    @Body() body: any,
  ) {
    const imageUrl = files?.imageUrl ? await processSingleFile(files.imageUrl[0], 'experience') : null;
    const bannerUrl = files?.bannerUrl ? await processSingleFile(files.bannerUrl[0], 'experience') : null;
    const payload = { ...body, ...(imageUrl && { imageUrl }), ...(bannerUrl && { bannerUrl }) };
    
    if (payload.isActive !== undefined) {
      payload.isActive = payload.isActive === 'true' || payload.isActive === true;
    }
    if (payload.isFeatured !== undefined) {
      payload.isFeatured = payload.isFeatured === 'true' || payload.isFeatured === true;
    }

    const experience = await this.experiencesService.createExperience(payload);
    return { message: 'successfully created experience details', data: experience };
  }

  @Put(':id')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'imageUrl', maxCount: 1 },
      { name: 'bannerUrl', maxCount: 1 },
    ], { storage: experienceStorage }),
  )
  async updateExperience(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() files: { imageUrl?: Express.Multer.File[], bannerUrl?: Express.Multer.File[] },
    @Body() body: any,
  ) {
    const imageUrl = files?.imageUrl ? await processSingleFile(files.imageUrl[0], 'experience') : null;
    const bannerUrl = files?.bannerUrl ? await processSingleFile(files.bannerUrl[0], 'experience') : null;
    const payload = { ...body, ...(imageUrl && { imageUrl }), ...(bannerUrl && { bannerUrl }) };

    if (payload.isActive !== undefined) {
      payload.isActive = payload.isActive === 'true' || payload.isActive === true;
    }
    if (payload.isFeatured !== undefined) {
      payload.isFeatured = payload.isFeatured === 'true' || payload.isFeatured === true;
    }

    const updated = await this.experiencesService.updateExperience(id, payload);
    return { message: 'successfully updated experience details', data: updated };
  }

  @Delete(':id')
  async deleteExperience(@Param('id', ParseIntPipe) id: number) {
    await this.experiencesService.deleteExperience(id);
    return { message: 'successfully deleted experience detail' };
  }
}
