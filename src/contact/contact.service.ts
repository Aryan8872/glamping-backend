import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ContactService {
  constructor(private readonly prisma: PrismaService) {}

  async getContact() {
    let contact = await this.prisma.contact.findUnique({
      where: { id: 1 },
    });
    if (!contact) {
      contact = await this.prisma.contact.create({
        data: {
          id: 1,
          email: 'info@example.com',
          phoneNumber: '+1234567890',
          address: '123 Main St, City, Country',
          facebookUrl: 'https://facebook.com',
          instagramUrl: 'https://instagram.com',
          twitterUrl: 'https://twitter.com',
        },
      });
    }
    return contact;
  }

  async updateContact(data: any) {
    await this.getContact();
    return this.prisma.contact.update({
      where: { id: 1 },
      data,
    });
  }
}
