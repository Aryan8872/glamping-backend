import {
  Injectable, BadRequestException, NotFoundException, ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async createBooking(validated: any) {
    const camp = await this.prisma.campSite.findUnique({
      where: { id: validated.campSiteId },
      include: {
        discounts: {
          where: { active: true, startsAt: { lte: new Date() }, OR: [{ endsAt: null }, { endsAt: { gte: new Date() } }] },
          orderBy: { startsAt: 'desc' },
        },
        adventures: { select: { adventureId: true } },
      },
    });

    if (!camp) throw new NotFoundException('Campsite not found');

    const adventureIds = camp.adventures.map((a) => a.adventureId);
    const adventureDiscounts = await this.prisma.discount.findMany({
      where: {
        adventureId: { in: adventureIds }, active: true,
        startsAt: { lte: new Date() },
        OR: [{ endsAt: null }, { endsAt: { gte: new Date() } }],
      },
      orderBy: { startsAt: 'desc' },
    });

    const allDiscounts = [...camp.discounts, ...adventureDiscounts].sort(
      (a, b) => b.startsAt.getTime() - a.startsAt.getTime(),
    );

    const checkIn = new Date(validated.checkInDate);
    const checkOut = new Date(validated.checkOutDate);
    if (checkIn >= checkOut) throw new BadRequestException('checkInDate must be before checkOutDate');

    const nights = this.calculateNights(checkIn, checkOut);

    let finalPricePerNight = Number(camp.pricePerNight);
    if (allDiscounts.length > 0) {
      const d = allDiscounts[0];
      if (d.type === 'PERCENTAGE') finalPricePerNight -= (finalPricePerNight * d.amount) / 100;
      else if (d.type === 'FIXED') finalPricePerNight -= d.amount;
    }

    const totalPrice = Math.max(0, finalPricePerNight) * nights;

    const result = await this.prisma.$transaction(async (tx) => {
      const availability = await this.getCampAvailability(validated.campSiteId, checkIn, checkOut, null, tx);
      const requestedGuests = validated.adults + (validated.children || 0);
      const isAvailable = availability.every((day: any) => day.remainingSlots >= requestedGuests);
      if (!isAvailable) throw new ConflictException('Requested number of guests exceeds available capacity');

      if (validated.adults > (camp.maxAdult ?? Number.MAX_SAFE_INTEGER)) throw new BadRequestException('Adults exceed campsite capacity');
      if ((validated.children || 0) > (camp.maxChildren ?? Number.MAX_SAFE_INTEGER)) throw new BadRequestException('Children exceed campsite capacity');
      if ((validated.pets || 0) > (camp.maxPets ?? Number.MAX_SAFE_INTEGER)) throw new BadRequestException('Pets exceed campsite policy');

      return tx.campBookings.create({
        data: {
          campSiteId: validated.campSiteId,
          checkInDate: checkIn, checkOutDate: checkOut,
          adults: validated.adults, children: validated.children || 0, pets: validated.pets || 0,
          totalPrice,
          userId: validated.userId ?? undefined,
          guestUserFullName: validated.guestUserFullName ?? undefined,
          guestUserEmail: validated.guestUserEmail ?? undefined,
          guestUserPhoneNumber: validated.guestUserPhoneNumber ?? undefined,
        },
      });
    });

    return result;
  }

  async updateBooking(id: number, data: any) {
    const booking = await this.prisma.campBookings.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException('Booking not found');

    return this.prisma.$transaction(async (tx) => {
      if (data.checkInDate || data.checkOutDate || data.adults !== undefined || data.children !== undefined) {
        const checkIn = data.checkInDate ? new Date(data.checkInDate) : booking.checkInDate;
        const checkOut = data.checkOutDate ? new Date(data.checkOutDate) : booking.checkOutDate;
        if (checkIn >= checkOut) throw new BadRequestException('checkInDate must be before checkOutDate');

        const availability = await this.getCampAvailability(booking.campSiteId, checkIn, checkOut, id, tx);
        const adults = data.adults !== undefined ? data.adults : booking.adults;
        const children = data.children !== undefined ? data.children : booking.children;
        const isAvailable = availability.every((day: any) => day.remainingSlots >= adults + children);
        if (!isAvailable) throw new ConflictException('Requested update exceeds available capacity');
      }

      return tx.campBookings.update({
        where: { id },
        data: {
          adults: data.adults ?? undefined, children: data.children ?? undefined,
          pets: data.pets ?? undefined,
          checkInDate: data.checkInDate ? new Date(data.checkInDate) : undefined,
          checkOutDate: data.checkOutDate ? new Date(data.checkOutDate) : undefined,
          bookingStatus: data.bookingStatus ?? undefined,
          paymentStatus: data.paymentStatus ?? undefined,
        },
      });
    });
  }

  async cancelBooking(id: number) {
    const existing = await this.prisma.campBookings.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Booking not found');
    return this.prisma.campBookings.update({ where: { id }, data: { bookingStatus: 'CANCELED' } });
  }

  async searchBookings({ q, page = 1, perPage = 10, status, checkIn, checkOut }: any) {
    const take = Math.max(1, Number(perPage) || 10);
    const skip = (Math.max(1, Number(page)) - 1) * take;
    const where: any = {};
    if (q) {
      where.OR = [
        { guestUserFullName: { contains: q, mode: 'insensitive' } },
        { guestUserEmail: { contains: q, mode: 'insensitive' } },
        { campSite: { name: { contains: q, mode: 'insensitive' } } },
        { userInfo: { fullName: { contains: q, mode: 'insensitive' } } },
      ];
    }
    if (status) where.bookingStatus = status;
    if (checkIn) where.checkInDate = { gte: new Date(checkIn) };
    if (checkOut) where.checkOutDate = { lte: new Date(checkOut) };

    const [total, results] = await Promise.all([
      this.prisma.campBookings.count({ where }),
      this.prisma.campBookings.findMany({
        where, take, skip,
        include: {
          campSite: { select: { name: true, slug: true } },
          userInfo: { select: { fullName: true, email: true } },
        },
        orderBy: { id: 'desc' },
      }),
    ]);

    return { total, results, page: Number(page), limit: take, totalPages: Math.ceil(total / take), hasMore: skip + take < total };
  }

  async getCampAvailability(campId: number, startDate: Date, endDate: Date, ignoreBookingId: number | null = null, tx: any = null) {
    const client = tx || this.prisma;
    const camp = await client.campSite.findUnique({ where: { id: campId }, select: { maxAdult: true, maxChildren: true } });
    if (!camp) throw new NotFoundException('Camp not found');
    const totalSlots = (camp.maxAdult || 0) + (camp.maxChildren || 0);

    const bookings = await client.campBookings.findMany({
      where: {
        campSiteId: campId, bookingStatus: 'BOOKED',
        id: ignoreBookingId ? { not: ignoreBookingId } : undefined,
        checkInDate: { lt: endDate }, checkOutDate: { gt: startDate },
      },
      select: { checkInDate: true, checkOutDate: true, adults: true, children: true },
    });

    const dailyAvailability: any[] = [];
    const start = new Date(startDate); start.setHours(0, 0, 0, 0);
    const end = new Date(endDate); end.setHours(0, 0, 0, 0);

    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      const currentDay = new Date(d);
      const bookedGuests = bookings
        .filter((b: any) => {
          const bIn = new Date(b.checkInDate); bIn.setHours(0, 0, 0, 0);
          const bOut = new Date(b.checkOutDate); bOut.setHours(0, 0, 0, 0);
          return currentDay >= bIn && currentDay < bOut;
        })
        .reduce((sum: number, b: any) => sum + b.adults + b.children, 0);

      dailyAvailability.push({
        date: currentDay.toISOString().split('T')[0],
        bookedGuests, remainingSlots: Math.max(0, totalSlots - bookedGuests),
        totalSlots, isFullyBooked: bookedGuests >= totalSlots,
      });
    }
    return dailyAvailability;
  }

  private calculateNights(checkIn: Date, checkOut: Date): number {
    const ms = checkOut.getTime() - checkIn.getTime();
    return Math.ceil(ms / (1000 * 60 * 60 * 24));
  }
}
