import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class DiscountsService {
  constructor(private readonly prisma: PrismaService) {}

  async createDiscountService(data: any) {
    return this.prisma.discount.create({ data });
  }

  async searchDiscounts({ q, page = 1, perPage = 10, active }: any) {
    const take = Math.max(1, Number(perPage) || 10);
    const skip = (Math.max(1, Number(page)) - 1) * take;

    const where: any = {};
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { camp: { name: { contains: q, mode: 'insensitive' } } },
        { adventure: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }
    if (active !== undefined) {
      where.active = active === 'true' || active === true;
    }

    const [total, results] = await Promise.all([
      this.prisma.discount.count({ where }),
      this.prisma.discount.findMany({
        where, take, skip,
        include: { camp: { select: { name: true } }, adventure: { select: { name: true } } },
        orderBy: { id: 'desc' },
      }),
    ]);

    return { total, results, page: Number(page), perPage: take };
  }

  async getAllDiscountsService() {
    return this.prisma.discount.findMany({
      include: { camp: { select: { name: true } }, adventure: { select: { name: true } } },
    });
  }

  async getDiscountByIdService(id: number) {
    return this.prisma.discount.findUnique({
      where: { id },
      include: { camp: { select: { name: true } }, adventure: { select: { name: true } } },
    });
  }

  async updateDiscountService(id: number, data: any) {
    return this.prisma.discount.update({ where: { id }, data });
  }

  async deleteDiscountService(id: number) {
    return this.prisma.discount.delete({ where: { id } });
  }

  async getActiveDiscountsService() {
    const now = new Date();
    return this.prisma.discount.findMany({
      where: {
        active: true,
        startsAt: { lte: now },
        OR: [{ endsAt: null }, { endsAt: { gte: now } }],
      },
      include: { camp: { select: { name: true } }, adventure: { select: { name: true } } },
    });
  }

  async getFeaturedDiscountService() {
    const now = new Date();
    return this.prisma.discount.findFirst({
      where: {
        isFeatured: true,
        active: true,
        startsAt: { lte: now },
        OR: [{ endsAt: null }, { endsAt: { gte: now } }],
      },
      include: {
        camp: { select: { id: true, slug: true, name: true } },
        adventure: { select: { id: true, slug: true, name: true } },
      },
      orderBy: { startsAt: 'desc' },
    });
  }
}
