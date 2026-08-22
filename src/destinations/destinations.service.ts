import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { safeDelete } from '../upload/upload.utils.js';

@Injectable()
export class DestinationsService {
  constructor(private readonly prisma: PrismaService) {}

  async searchDestinations({ q, page = 1, perPage = 10, isActive, isFeatured }: any) {
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
      this.prisma.destination.count({ where }),
      this.prisma.destination.findMany({
        where, take, skip,
        include: { _count: { select: { campSites: true } } },
        orderBy: { id: 'desc' },
      }),
    ]);

    return { total, results, page: Number(page), limit: take, totalPages: Math.ceil(total / take), hasMore: skip + take < total };
  }

  async getAllDestinations(includeInactive = false) {
    const where = includeInactive ? {} : { isActive: true };
    return this.prisma.destination.findMany({
      where,
      orderBy: { isFeatured: 'desc' },
      include: { _count: { select: { campSites: true } } },
    });
  }

  async getDestinationById(id: number) {
    const destination = await this.prisma.destination.findUnique({
      where: { id },
      include: {
        campSites: {
          include: { campSiteFacilities: { include: { facility: true } } },
        },
      },
    });
    if (!destination) throw new NotFoundException('Destination not found');
    return destination;
  }

  async getDestinationBySlug(slug: string) {
    const destination = await this.prisma.destination.findUnique({
      where: { slug },
      include: {
        campSites: {
          include: { campSiteFacilities: { include: { facility: true } } },
        },
      },
    });
    if (!destination) throw new NotFoundException('Destination not found');
    return destination;
  }

  async createDestination(data: any) {
    if (data.slug) {
      const existing = await this.prisma.destination.findUnique({ where: { slug: data.slug } });
      if (existing) throw new ConflictException('Destination with this slug already exists');
    } else if (data.name) {
      const slugBase = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
      data.slug = `${slugBase}-${Date.now().toString().slice(-5)}`;
    }
    return this.prisma.destination.create({ data });
  }

  async updateDestination(id: number, data: any) {
    const destination = await this.prisma.destination.findUnique({ where: { id } });
    if (!destination) throw new NotFoundException('Destination not found');

    if (data.slug && data.slug !== destination.slug) {
      const existing = await this.prisma.destination.findUnique({ where: { slug: data.slug } });
      if (existing) throw new ConflictException('Destination with this slug already exists');
    }

    const imagesToDelete: string[] = [];
    if (data.imageUrl && destination.imageUrl && data.imageUrl !== destination.imageUrl) {
      imagesToDelete.push(destination.imageUrl);
    }
    if (data.bannerUrl && destination.bannerUrl && data.bannerUrl !== destination.bannerUrl) {
      imagesToDelete.push(destination.bannerUrl);
    }
    if (imagesToDelete.length) {
      safeDelete(imagesToDelete).catch(err => console.error(`Failed to delete old destination images:`, err));
    }

    return this.prisma.destination.update({
      where: { id },
      data: {
        name: data.name ?? destination.name,
        description: data.description ?? destination.description,
        title: data.title ?? destination.title,
        pageDescription: data.pageDescription ?? destination.pageDescription,
        slug: data.slug ?? destination.slug,
        imageUrl: data.imageUrl ?? destination.imageUrl,
        bannerUrl: data.bannerUrl ?? destination.bannerUrl,
        isActive: data.isActive ?? destination.isActive,
        isFeatured: data.isFeatured ?? destination.isFeatured,
      },
    });
  }

  async deleteDestination(id: number) {
    const destination = await this.prisma.destination.findUnique({
      where: { id }, select: { imageUrl: true, bannerUrl: true },
    });
    if (!destination) throw new NotFoundException('Destination not found');

    const result = await this.prisma.destination.delete({ where: { id } });

    const imagesToDelete: string[] = [];
    if (destination.imageUrl) imagesToDelete.push(destination.imageUrl);
    if (destination.bannerUrl) imagesToDelete.push(destination.bannerUrl);
    if (imagesToDelete.length) {
      safeDelete(imagesToDelete).catch(err => console.error(`Failed to delete images for destination ${id}:`, err));
    }

    return result;
  }
}
