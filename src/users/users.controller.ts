import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  Req,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { UsersService } from './users.service.js';
import { processSingleFile } from '../upload/upload.utils.js';
import { Public } from '../decorators/public.decorator.js';

const userStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), 'uploads', 'user');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

@Controller('user')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Public()
  @Get('camphosts')
  async getCampHosts() {
    const hosts = await this.usersService.getCampHostUsers();
    return { message: 'successfully retrieved camphosts', data: hosts };
  }

  @Public()
  @Get('featured-hosts')
  async getFeaturedHosts() {
    const hosts = await this.usersService.getFeaturedHosts();
    return { data: hosts };
  }

  @Get('all')
  async getAllUsers(
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('userType') userType?: string,
    @Query('userStatus') userStatus?: string,
  ) {
    const result = await this.usersService.searchUsers({
      q,
      page: Number(page) || 1,
      perPage: Number(limit) || 15,
      userType,
      userStatus,
    });

    return {
      message: 'successfully retrieved users',
      data: result.results,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      hasMore: result.hasMore,
    };
  }

  @Get(':userId')
  async getUserById(@Param('userId', ParseIntPipe) userId: number) {
    const user = await this.usersService.getUserById(userId);
    return { message: 'successfully retrieved user by id', data: user };
  }

  @Post('new')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('profilePicture', { storage: userStorage }))
  async createUser(@UploadedFile() file: Express.Multer.File, @Body() body: any) {
    const profilePicture = await processSingleFile(file, 'user');

    const payload = {
      ...body,
      ...(profilePicture && { profilePicture }),
      isFeatured: body.isFeatured === 'true' || body.isFeatured === true,
      yearsOfExperience: body.yearsOfExperience
        ? Number(body.yearsOfExperience)
        : 0,
    };

    const newUser = await this.usersService.createUser(payload);
    return { message: 'successfully created user', data: newUser };
  }

  @Patch(':userId')
  @UseInterceptors(FileInterceptor('profilePicture', { storage: userStorage }))
  async updateUser(
    @Param('userId', ParseIntPipe) userId: number,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
  ) {
    const profilePicture = await processSingleFile(file, 'user');

    const payload: any = {
      ...body,
      ...(profilePicture && { profilePicture }),
    };

    if (payload.isFeatured !== undefined) {
      payload.isFeatured = payload.isFeatured === 'true' || payload.isFeatured === true;
    }
    if (payload.yearsOfExperience !== undefined) {
      payload.yearsOfExperience = Number(payload.yearsOfExperience);
    }

    const updatedUser = await this.usersService.updateUser(userId, payload);
    return { message: 'successfully updated user', data: updatedUser };
  }
}
