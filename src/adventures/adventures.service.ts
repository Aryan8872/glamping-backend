import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { safeDelete } from '../upload/upload.utils.js';

@Injectable()
export class AdventuresService {
  constructor(private readonly prisma: PrismaService) {}

  async searchAdventures({ q, page = 1, perPage = 10, isActive }: any) {
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

    const [total, results] = await Promise.all([
      this.prisma.adventure.count({ where }),
      this.prisma.adventure.findMany({
        where, take, skip,
        include: { _count: { select: { campSites: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { total, results, page: Number(page), limit: take, totalPages: Math.ceil(total / take), hasMore: skip + take < total };
  }

  async getAllAdventures(includeInactive = false) {
    const where = includeInactive ? {} : { isActive: true };
    return this.prisma.adventure.findMany({
      where,
      include: {
        campSites: {
          include: {
            campSite: { select: { id: true, name: true, slug: true, images: true, pricePerNight: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAdventureById(id: number) {
    const adventure = await this.prisma.adventure.findUnique({
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
    if (!adventure) throw new NotFoundException('Adventure not found');
    return adventure;
  }

  async getAdventureBySlug(slug: string) {
    const adventure = await this.prisma.adventure.findUnique({
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
    if (!adventure) throw new NotFoundException('Adventure not found');
    return adventure;
  }

  async createAdventure(data: any) {
    if (data.slug) {
      const existing = await this.prisma.adventure.findUnique({ where: { slug: data.slug } });
      if (existing) throw new ConflictException('Adventure with this slug already exists');
    } else if (data.name) {
      const slugBase = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
      data.slug = `${slugBase}-${Date.now().toString().slice(-5)}`;
    }
    return this.prisma.adventure.create({ data });
  }

  async updateAdventure(id: number, data: any) {
    const adventure = await this.prisma.adventure.findUnique({ where: { id } });
    if (!adventure) throw new NotFoundException('Adventure not found');

    if (data.slug && data.slug !== adventure.slug) {
      const existing = await this.prisma.adventure.findUnique({ where: { slug: data.slug } });
      if (existing) throw new ConflictException('Adventure with this slug already exists');
    }

    const imagesToDelete: string[] = [];
    if (data.bannerImage && adventure.bannerImage && data.bannerImage !== adventure.bannerImage) {
      imagesToDelete.push(adventure.bannerImage);
    }
    if (data.coverImage && adventure.coverImage && data.coverImage !== adventure.coverImage) {
      imagesToDelete.push(adventure.coverImage);
    }
    if (imagesToDelete.length) {
      safeDelete(imagesToDelete).catch(err => console.error(`Failed to delete old adventure images:`, err));
    }

    return this.prisma.adventure.update({
      where: { id },
      data: {
        title: data.title ?? adventure.title,
        pageDescription: data.pageDescription ?? adventure.pageDescription,
        bannerImage: data.bannerImage ?? adventure.bannerImage,
        coverImage: data.coverImage ?? adventure.coverImage,
        description: data.description ?? adventure.description,
        name: data.name ?? adventure.name,
        slug: data.slug ?? adventure.slug,
        isActive: data.isActive ?? adventure.isActive,
      },
    });
  }

  async deleteAdventure(id: number) {
    const adventure = await this.prisma.adventure.findUnique({
      where: { id }, select: { bannerImage: true, coverImage: true },
    });
    if (!adventure) throw new NotFoundException('Adventure not found');

    const result = await this.prisma.adventure.delete({ where: { id } });

    const imagesToDelete: string[] = [];
    if (adventure.bannerImage) imagesToDelete.push(adventure.bannerImage);
    if (adventure.coverImage) imagesToDelete.push(adventure.coverImage);
    if (imagesToDelete.length) {
      safeDelete(imagesToDelete).catch(err => console.error(`Failed to delete images for adventure ${id}:`, err));
    }

    return result;
  }

  async assignAdventuresToCamp(campId: number, adventureIds: number[]) {
    const camp = await this.prisma.campSite.findUnique({ where: { id: campId } });
    if (!camp) throw new NotFoundException('Camp not found');

    await this.prisma.campSiteAdventure.deleteMany({ where: { campId } });

    if (adventureIds && adventureIds.length > 0) {
      await this.prisma.campSiteAdventure.createMany({
        data: adventureIds.map((advId) => ({ campId, adventureId: advId })),
      });
    }

    return this.prisma.campSite.findUnique({
      where: { id: campId },
      include: { adventures: { include: { adventure: true } } },
    });
  }
}
