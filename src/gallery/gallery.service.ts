import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { safeDelete } from '../upload/upload.utils.js';
import { GalleryStatus } from '@prisma/client';

@Injectable()
export class GalleryService {
  constructor(private readonly prisma: PrismaService) {}

  async createGalleryService(data: any) {
    if (!data.slug && data.title) {
      const slugBase = data.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
      data.slug = `${slugBase}-${Date.now().toString().slice(-5)}`;
    }

    return this.prisma.gallery.create({
      data: {
        title: data.title,
        description: data.description || '',
        excerpt: data.excerpt || '',
        images: data.images || [],
        coverImage: data.coverImage || '',
        slug: data.slug,
        metaTitle: data.metaTitle || null,
        metaDescription: data.metaDescription || null,
        metaKeywords: data.metaKeywords || null,
        imageAlt: data.imageAlt || null,
      },
    });
  }

  async updateGalleryService(slug: string, updateData: any) {
    const exists = await this.prisma.gallery.findUnique({ where: { slug } });
    if (!exists) throw new NotFoundException('Gallery not found');

    if (updateData.removedImages && Array.isArray(updateData.removedImages)) {
      await safeDelete(updateData.removedImages);
    }

    let finalImages = exists.images || [];
    if (Array.isArray(updateData.images)) finalImages = updateData.images as string[];
    if (Array.isArray(updateData.newImages) && updateData.newImages.length) {
      finalImages = [...finalImages, ...updateData.newImages];
    }

    let finalCoverImage = exists.coverImage;
    if (updateData.coverImage) {
      if (exists.coverImage) await safeDelete(exists.coverImage);
      finalCoverImage = updateData.coverImage;
    }

    return this.prisma.gallery.update({
      where: { slug },
      data: {
        title: updateData.title !== undefined ? updateData.title : exists.title,
        description: updateData.description !== undefined ? updateData.description : exists.description,
        excerpt: updateData.excerpt !== undefined ? updateData.excerpt : exists.excerpt,
        images: finalImages,
        galleryStatus: updateData.galleryStatus !== undefined ? updateData.galleryStatus : exists.galleryStatus,
        coverImage: finalCoverImage,
        metaTitle: updateData.metaTitle !== undefined ? updateData.metaTitle : exists.metaTitle,
        metaDescription: updateData.metaDescription !== undefined ? updateData.metaDescription : exists.metaDescription,
        metaKeywords: updateData.metaKeywords !== undefined ? updateData.metaKeywords : exists.metaKeywords,
        imageAlt: updateData.imageAlt !== undefined ? updateData.imageAlt : exists.imageAlt,
      },
    });
  }

  async getGalleryService() {
    return this.prisma.gallery.findMany({
      where: { galleryStatus: { in: ['PUBLISHED', 'DRAFT'] } },
      select: {
        id: true, title: true, coverImage: true, excerpt: true, description: true, slug: true,
        images: true, imageAlt: true, galleryStatus: true, metaDescription: true,
        metaKeywords: true, metaTitle: true, createdAt: true, updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getGalleryBySlugService(slug: string) {
    return this.prisma.gallery.findUnique({ where: { slug } });
  }

  async updateGalleryStatusService(slug: string, status: string) {
    if (!Object.values(GalleryStatus).includes(status as GalleryStatus)) return false;
    return this.prisma.gallery.update({
      where: { slug }, data: { galleryStatus: status as GalleryStatus },
    });
  }

  async deleteGalleryService(id: number) {
    const gallery = await this.prisma.gallery.findUnique({
      where: { id }, select: { images: true, coverImage: true },
    });

    const result = await this.prisma.gallery.update({
      where: { id }, data: { galleryStatus: 'DELETED' },
    });

    const imagesToDelete: string[] = [];
    if (gallery?.images?.length) imagesToDelete.push(...gallery.images as string[]);
    if (gallery?.coverImage) imagesToDelete.push(gallery.coverImage);

    if (imagesToDelete.length) {
      safeDelete(imagesToDelete).catch(err => {
        console.error(`Failed to delete images for gallery ${id}:`, err);
      });
    }

    return result;
  }
}
