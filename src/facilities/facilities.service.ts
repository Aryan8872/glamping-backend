import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class FacilitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async createFacility(data: any) {
    if (!data.slug && data.name) {
      const slugBase = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
      data.slug = `${slugBase}-${Date.now().toString().slice(-5)}`;
    }
    return this.prisma.facility.create({
      data: {
        name: data.name,
        icon: data.icon ?? '',
        slug: data.slug,
        description: data.description,
      },
    });
  }

  async getAllFacilities() {
    return this.prisma.facility.findMany({
      include: { campSites: true },
    });
  }

  async getFacilityById(id: number) {
    return this.prisma.facility.findUnique({
      where: { id },
      include: { campSites: true },
    });
  }

  async updateFacility(id: number, data: any) {
    return this.prisma.facility.update({
      where: { id },
      data: {
        name: data.name,
        icon: data.icon,
        description: data.description,
      },
    });
  }

  async deleteFacility(id: number) {
    await this.prisma.campSiteFacility.deleteMany({
      where: { facilityId: id },
    });
    return this.prisma.facility.delete({
      where: { id },
    });
  }
}
