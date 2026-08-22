import {
  Controller, Get, Post, Patch, Param, Body,
  HttpCode, HttpStatus, UseInterceptors, UploadedFile,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { BlogsService } from './blogs.service.js';
import { processSingleFile } from '../upload/upload.utils.js';
import { Public } from '../decorators/public.decorator.js';

const blogStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), 'uploads', 'blog');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

@Controller('blog')
export class BlogsController {
  constructor(private readonly blogsService: BlogsService) {}

  @Post('new')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('coverImage', { storage: blogStorage }))
  async addNewBlog(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
  ) {
    const coverImage = await processSingleFile(file, 'blog');
    
    let tags = body.tags;
    if (typeof tags === 'string') {
      tags = tags.split(',').map((t: string) => t.trim());
    }

    const payload = { ...body, ...(coverImage && { coverImage }), tags };
    const blog = await this.blogsService.addNewBlogService(payload);
    return { message: 'successfully created Blog', data: blog };
  }

  @Public()
  @Get('all')
  async getAllBlogs() {
    const data = await this.blogsService.getAllBlogService();
    return { message: 'successfully fetched all blog details', data };
  }

  @Public()
  @Get(':blogId')
  async getBlogById(@Param('blogId', ParseIntPipe) blogId: number) {
    const blog = await this.blogsService.getBlogByIDService(blogId);
    if (!blog) return { message: 'Blog not found' };
    return { message: 'successfully returned searched blog details', data: blog };
  }

  @Patch(':blogId/:status')
  async updateBlogStatus(
    @Param('blogId', ParseIntPipe) blogId: number,
    @Param('status') status: string,
  ) {
    const updated = await this.blogsService.updateBlogStatusService(blogId, status);
    if (!updated) return { message: 'invalid status' };
    return { message: 'successfully updated blog details', data: updated };
  }
}
