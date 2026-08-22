import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { safeDelete } from '../upload/upload.utils.js';
import { BlogStatus } from '@prisma/client';

@Injectable()
export class BlogsService {
  constructor(private readonly prisma: PrismaService) {}

  async addNewBlogService(data: any) {
    const slugBase = data.title
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-]/g, '');
    data.slug = `${slugBase}-${Date.now().toString().slice(-5)}`;
    return this.prisma.blog.create({ data });
  }

  async getAllBlogService() {
    return this.prisma.blog.findMany({
      select: {
        id: true, title: true, excerpt: true, author: true, slug: true,
        createdAt: true, updatedAt: true, metaTitle: true, metaDescription: true,
        metaKeywords: true, indexable: true, coverImage: true, tags: true, status: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getBlogByIDService(id: number) {
    return this.prisma.blog.findUnique({
      where: { id },
      select: {
        id: true, title: true, excerpt: true, content: true, author: true, slug: true,
        createdAt: true, updatedAt: true, metaTitle: true, metaDescription: true,
        metaKeywords: true, indexable: true, coverImage: true, tags: true, status: true,
      },
    });
  }

  async updateBlogStatusService(blogId: number, status: string) {
    if (Object.values(BlogStatus).includes(status as BlogStatus)) {
      return this.prisma.blog.update({
        where: { id: blogId },
        data: { status: status as BlogStatus },
      });
    }
    return false;
  }

  async updateBlogService(id: number, data: any) {
    const existingBlog = await this.prisma.blog.findUnique({
      where: { id }, select: { coverImage: true },
    });

    if (data.coverImage && existingBlog?.coverImage && data.coverImage !== existingBlog.coverImage) {
      safeDelete(existingBlog.coverImage).catch(err => {
        console.error(`Failed to delete old blog cover image:`, err);
      });
    }

    return this.prisma.blog.update({ where: { id }, data });
  }

  async deleteBlogService(id: number) {
    const blog = await this.prisma.blog.findUnique({
      where: { id }, select: { coverImage: true },
    });

    const result = await this.prisma.blog.update({
      where: { id }, data: { status: 'DELETED' },
    });

    if (blog?.coverImage) {
      safeDelete(blog.coverImage).catch(err => {
        console.error(`Failed to delete cover image for blog ${id}:`, err);
      });
    }

    return result;
  }
}
