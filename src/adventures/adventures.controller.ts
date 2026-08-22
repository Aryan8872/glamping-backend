import {
  Controller, Get, Post, Put, Delete, Param, Query, Body,
  HttpCode, HttpStatus, UseInterceptors, UploadedFiles,
  ParseIntPipe,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { AdventuresService } from './adventures.service.js';
import { processSingleFile } from '../upload/upload.utils.js';
import { Public } from '../decorators/public.decorator.js';

const adventureStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), 'uploads', 'adventure');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

@Controller('adventure')
export class AdventuresController {
  constructor(private readonly adventuresService: AdventuresService) {}

  @Public()
  @Get('search')
  async searchAdventures(
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('isActive') isActive?: string,
  ) {
    const result = await this.adventuresService.searchAdventures({
      q, page: Number(page) || 1, perPage: Number(limit) || 10, isActive,
    });
    return { message: 'Adventures searched successfully', ...result };
  }

  @Public()
  @Get('all')
  async getAllAdventures() {
    const result = await this.adventuresService.getAllAdventures();
    return { message: 'successfully returned all active adventure details', data: result };
  }

  @Public()
  @Get('all/admin')
  async getAllAdventuresAdmin() {
    const result = await this.adventuresService.getAllAdventures(true);
    return { message: 'successfully returned all adventure details', data: result };
  }

  @Public()
  @Get('slug/:slug')
  async getAdventureBySlugRoute(@Param('slug') slug: string) {
    const result = await this.adventuresService.getAdventureBySlug(slug);
    return { message: 'successfully returned searched adventure details', data: result };
  }

  @Public()
  @Get(':identifier')
  async getAdventureByIdentifier(@Param('identifier') identifier: string) {
    let result;
    if (!isNaN(Number(identifier))) {
      result = await this.adventuresService.getAdventureById(Number(identifier));
    } else {
      result = await this.adventuresService.getAdventureBySlug(identifier);
    }
    return { message: 'successfully returned searched adventure details', data: result };
  }

  @Post('new')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'coverImage', maxCount: 1 },
      { name: 'bannerImage', maxCount: 1 },
    ], { storage: adventureStorage }),
  )
  async createAdventure(
    @UploadedFiles() files: { coverImage?: Express.Multer.File[], bannerImage?: Express.Multer.File[] },
    @Body() body: any,
  ) {
    const coverImage = files?.coverImage ? await processSingleFile(files.coverImage[0], 'adventure') : null;
    const bannerImage = files?.bannerImage ? await processSingleFile(files.bannerImage[0], 'adventure') : null;
    const payload = { ...body, ...(coverImage && { coverImage }), ...(bannerImage && { bannerImage }) };
    
    if (payload.isActive !== undefined) {
      payload.isActive = payload.isActive === 'true' || payload.isActive === true;
    }

    const adventure = await this.adventuresService.createAdventure(payload);
    return { message: 'successfully created adventure details', data: adventure };
  }

  @Put(':id')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'coverImage', maxCount: 1 },
      { name: 'bannerImage', maxCount: 1 },
    ], { storage: adventureStorage }),
  )
  async updateAdventure(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() files: { coverImage?: Express.Multer.File[], bannerImage?: Express.Multer.File[] },
    @Body() body: any,
  ) {
    const coverImage = files?.coverImage ? await processSingleFile(files.coverImage[0], 'adventure') : null;
    const bannerImage = files?.bannerImage ? await processSingleFile(files.bannerImage[0], 'adventure') : null;
    const payload = { ...body, ...(coverImage && { coverImage }), ...(bannerImage && { bannerImage }) };

    if (payload.isActive !== undefined) {
      payload.isActive = payload.isActive === 'true' || payload.isActive === true;
    }

    const updated = await this.adventuresService.updateAdventure(id, payload);
    return { message: 'successfully updated adventure details', data: updated };
  }

  @Delete(':id')
  async deleteAdventure(@Param('id', ParseIntPipe) id: number) {
    await this.adventuresService.deleteAdventure(id);
    return { message: 'successfully deleted adventure detail' };
  }

  @Post('assign/:campId')
  async assignAdventuresToCamp(
    @Param('campId', ParseIntPipe) campId: number,
    @Body('adventureIds') adventureIds: any,
  ) {
    let ids: number[] = [];
    if (Array.isArray(adventureIds)) {
      ids = adventureIds.map(Number).filter((n) => !isNaN(n));
    } else if (typeof adventureIds === 'string') {
      try {
        ids = JSON.parse(adventureIds).map(Number).filter((n: number) => !isNaN(n));
      } catch {
        ids = adventureIds.split(',').map(Number).filter((n) => !isNaN(n));
      }
    }
    const camp = await this.adventuresService.assignAdventuresToCamp(campId, ids);
    return { message: 'successfully assigned adventures to camp', data: camp };
  }
}
