import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { safeDelete } from '../upload/upload.utils.js';

@Injectable()
export class ExperiencesService {
  constructor(private readonly prisma: PrismaService) {}

  async searchExperiences({ q, page = 1, perPage = 10, isActive, isFeatured }: any) {
    const take = Math.max(1, Number(perPage) || 10);
    const skip = (Math.max(1, Number(page)) - 1) * take;

    const where: any = {};
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { title: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (isActive !== undefined) {
      where.isActive = isActive === 'true' || isActive === true;
    }
    if (isFeatured !== undefined) {
      where.isFeatured = isFeatured === 'true' || isFeatured === true;
    }

    const [total, results] = await Promise.all([
      this.prisma.experience.count({ where }),
      this.prisma.experience.findMany({
        where, take, skip,
        include: { _count: { select: { campSites: true } } },
        orderBy: { id: 'desc' },
      }),
    ]);

    return { total, results, page: Number(page), limit: take, totalPages: Math.ceil(total / take), hasMore: skip + take < total };
  }

  async getAllExperiences(includeInactive = false) {
    const where = includeInactive ? {} : { isActive: true };
    return this.prisma.experience.findMany({
      where,
      orderBy: { isFeatured: 'desc' },
      include: { _count: { select: { campSites: true } } },
    });
  }

  async getExperienceById(id: number) {
    const experience = await this.prisma.experience.findUnique({
      where: { id },
      include: {
        campSites: {
          include: {
            campSite: {
              include: { campSiteFacilities: { include: { facility: true } } },
            },
          },
        },
      },
    });
    if (!experience) throw new NotFoundException('Experience not found');
    return experience;
  }

  async getExperienceBySlug(slug: string) {
    const experience = await this.prisma.experience.findUnique({
      where: { slug },
      include: {
        campSites: {
          include: {
            campSite: {
              include: { campSiteFacilities: { include: { facility: true } } },
            },
          },
        },
      },
    });
    if (!experience) throw new NotFoundException('Experience not found');
    return experience;
  }

  async createExperience(data: any) {
    if (data.slug) {
      const existing = await this.prisma.experience.findUnique({ where: { slug: data.slug } });
      if (existing) throw new ConflictException('Experience with this slug already exists');
    } else if (data.name) {
      const slugBase = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
      data.slug = `${slugBase}-${Date.now().toString().slice(-5)}`;
    }
    return this.prisma.experience.create({ data });
  }

  async updateExperience(id: number, data: any) {
    const experience = await this.prisma.experience.findUnique({ where: { id } });
    if (!experience) throw new NotFoundException('Experience not found');

    if (data.slug && data.slug !== experience.slug) {
      const existing = await this.prisma.experience.findUnique({ where: { slug: data.slug } });
      if (existing) throw new ConflictException('Experience with this slug already exists');
    }

    const imagesToDelete: string[] = [];
    if (data.imageUrl && experience.imageUrl && data.imageUrl !== experience.imageUrl) {
      imagesToDelete.push(experience.imageUrl);
    }
    if (data.bannerUrl && experience.bannerUrl && data.bannerUrl !== experience.bannerUrl) {
      imagesToDelete.push(experience.bannerUrl);
    }
    if (imagesToDelete.length) {
      safeDelete(imagesToDelete).catch(err => console.error(`Failed to delete old experience images:`, err));
    }

    return this.prisma.experience.update({
      where: { id },
      data: {
        name: data.name ?? experience.name,
        description: data.description ?? experience.description,
        title: data.title ?? experience.title,
        pageDescription: data.pageDescription ?? experience.pageDescription,
        slug: data.slug ?? experience.slug,
        imageUrl: data.imageUrl ?? experience.imageUrl,
        bannerUrl: data.bannerUrl ?? experience.bannerUrl,
        isActive: data.isActive ?? experience.isActive,
        isFeatured: data.isFeatured ?? experience.isFeatured,
      },
    });
  }

  async deleteExperience(id: number) {
    const experience = await this.prisma.experience.findUnique({
      where: { id }, select: { imageUrl: true, bannerUrl: true },
    });
    if (!experience) throw new NotFoundException('Experience not found');

    const result = await this.prisma.experience.delete({ where: { id } });

    const imagesToDelete: string[] = [];
    if (experience.imageUrl) imagesToDelete.push(experience.imageUrl);
    if (experience.bannerUrl) imagesToDelete.push(experience.bannerUrl);
    if (imagesToDelete.length) {
      safeDelete(imagesToDelete).catch(err => console.error(`Failed to delete images for experience ${id}:`, err));
    }

    return result;
  }
}
