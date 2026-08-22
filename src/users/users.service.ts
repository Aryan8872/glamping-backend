import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { safeDelete } from '../upload/upload.utils.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(data: any) {
    return this.prisma.user.create({ data });
  }

  async updateUser(id: number, data: any) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
      select: { profilePicture: true },
    });

    if (
      data.profilePicture &&
      existingUser?.profilePicture &&
      data.profilePicture !== existingUser.profilePicture
    ) {
      safeDelete(existingUser.profilePicture).catch((err) => {
        console.error(`Failed to delete old profile picture for user ${id}:`, err);
      });
    }

    return this.prisma.user.update({ where: { id }, data });
  }

  async searchUsers({
    q,
    page = 1,
    perPage = 10,
    userType,
    userStatus,
  }: {
    q?: string;
    page?: number;
    perPage?: number;
    userType?: string;
    userStatus?: string;
  }) {
    const take = Math.max(1, Number(perPage) || 10);
    const skip = (Math.max(1, Number(page)) - 1) * take;

    const where: any = {};
    if (q) {
      where.OR = [
        { fullName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (userType) where.userType = userType;
    if (userStatus) where.userStatus = userStatus;

    const [total, results] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        take,
        skip,
        orderBy: { id: 'desc' },
      }),
    ]);

    return {
      total,
      results,
      page: Number(page),
      limit: take,
      totalPages: Math.ceil(total / take),
      hasMore: skip + take < total,
    };
  }

  async getUserById(id: number) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async getCampHostUsers() {
    return this.prisma.user.findMany({
      where: { userType: 'CAMPHOST' },
      include: { campSite: true },
    });
  }

  async getFeaturedHosts() {
    return this.prisma.user.findMany({
      where: { userType: 'CAMPHOST', isFeatured: true },
      include: { campSite: true },
      orderBy: { fullName: 'asc' },
    });
  }
}
