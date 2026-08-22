import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AboutUsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAboutUsService() {
    return this.prisma.aboutUs.findUnique({
      where: { id: 1 },
      include: { coreValues: true, stats: true },
    });
  }

  async updateAboutUsStat(id: number, data: any) {
    return this.prisma.stat.update({
      where: { id },
      data,
    });
  }

  async deleteAboutUsStat(id: number) {
    return this.prisma.stat.delete({
      where: { id },
    });
  }

  async createOrUpdateAboutUsService(data: any) {
    return this.prisma.aboutUs.upsert({
      where: { id: 1 },
      update: {
        aboutUs: data.aboutUs,
        textbox_1: data.textbox_1,
        textbox_2: data.textbox_2,
        mission: data.mission,
        vision: data.vision,
        updatedAt: new Date(),
        stats: {
          deleteMany: {},
          create: data.stats?.map((s: any) => ({
            value: s.value,
            icon: s.icon,
            heading: s.heading,
          })) || [],
        },
        coreValues: {
          deleteMany: {},
          create: data.coreValues?.map((c: any) => ({
            title: c.title,
            description: c.description,
            icon: c.icon,
          })) || [],
        },
      },
      create: {
        id: 1,
        aboutUs: data.aboutUs,
        textbox_1: data.textbox_1,
        textbox_2: data.textbox_2,
        mission: data.mission,
        vision: data.vision,
        stats: {
          create: data.stats?.map((s: any) => ({
            value: s.value,
            icon: s.icon,
            heading: s.heading,
          })) || [],
        },
        coreValues: {
          create: data.coreValues?.map((c: any) => ({
            title: c.title,
            description: c.description,
            icon: c.icon,
          })) || [],
        },
      },
      include: { coreValues: true, stats: true },
    });
  }
}
