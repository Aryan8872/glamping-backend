// services/booking.service.js
import prisma from "../../utils/prismaClient.js"; // adjust path
import {
  BadRequestError,
  NotFoundError,
  ConflictError,
} from "../../utils/error.js";
import {
  createBookingSchema,
  updateBookingSchema,
} from "../../validation/bookingSchema.js";

class BookingService {
  // Create booking (handles guest or registered user)
  async createBooking(raw) {
    console.log("raw data", raw);
    const data = createBookingSchema.safeParse(raw);
    if (!data.success) {
      throw new ConflictError(
        `validation error ${data.error.issues.forEach((issue, index) => {
          console.log(`path: ${issue.path.join(".")}`);
          console.log(`  Message: ${issue.message}`);
        })}`
      );
    }
    const validated = data.data
    const camp = await prisma.campSite.findUnique({
      where: { id: validated.campSiteId },
    });
    console.log("bboooked camp", camp);
    if (!camp) throw new NotFoundError("Campsite not found");

    // dates
    const checkIn = new Date(validated.checkInDate);
    const checkOut = new Date(validated.checkOutDate);
    if (checkIn >= checkOut)
      throw new BadRequestError("checkInDate must be before checkOutDate");

    // overlapping booking check (inclusive-exclusive)
    const overlap = await prisma.campBookings.findFirst({
      where: {
        campSiteId: data.campSiteId,
        bookingStatus: "BOOKED",
        checkInDate: { lt: checkOut },
        checkOutDate: { gt: checkIn },
      },
    });
    if (overlap)
      throw new ConflictError(
        "Selected dates overlap with an existing booking"
      );

    // capacity checks (assumes camp has maxAdult, maxChildren, maxPets fields)
    if (validated.adults > (camp.maxAdult ?? Number.MAX_SAFE_INTEGER))
      throw new BadRequestError("Adults exceed campsite capacity");
    if (validated.children > (camp.maxChildren ?? Number.MAX_SAFE_INTEGER))
      throw new BadRequestError("Children exceed campsite capacity");
    if (validated.pets > (camp.maxPets ?? Number.MAX_SAFE_INTEGER))
      throw new BadRequestError("Pets exceed campsite policy");

    // require guest info when anonymous
    if (!validated.userId) {
      if (
        !validated.guestUserFullName ||
        !validated.guestUserEmail ||
        !validated.guestUserPhoneNumber
      ) {
        throw new BadRequestError(
          "Guest name, email and phone are required for non-registered bookings"
        );
      }
    }

    const nights = this.calculateNights(checkIn, checkOut);
    const totalPrice = Number(camp.pricePerNight) * nights; // ensure decimal handling as needed
    console.log("abaout to create booking");
    // create booking inside transaction (future-proof)
    const booking = await prisma.$transaction(async (tx) => {
      const created = await tx.campBookings.create({
        data: {
          campSiteId: validated.campSiteId,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          adults: validated.adults,
          children: validated.children,
          pets: validated.pets,
          totalPrice,
          userId: validated.userId ?? undefined,
          guestUserFullName: validated.guestUserFullName ?? undefined,
          guestUserEmail: validated.guestUserEmail ?? undefined,
          guestUserPhoneNumber: validated.guestUserPhoneNumber ?? undefined,
        },
      });
      console.log("created booking successfully");
      // optionally: create payment intent / send notifications — keep separate services

      return created;
    });

    return booking;
  }

  async updateBooking(id, raw) {
    const data = updateBookingSchema.parse(raw);
    const booking = await prisma.campBookings.findUnique({ where: { id } });
    if (!booking) throw new NotFoundError("Booking not found");

    // If dates changed, validate overlap
    if (data.checkInDate || data.checkOutDate) {
      const checkIn = data.checkInDate
        ? new Date(data.checkInDate)
        : booking.checkInDate;
      const checkOut = data.checkOutDate
        ? new Date(data.checkOutDate)
        : booking.checkOutDate;
      if (checkIn >= checkOut)
        throw new BadRequestError("checkInDate must be before checkOutDate");

      const overlap = await prisma.campBookings.findFirst({
        where: {
          id: { not: id },
          campSiteId: booking.campSiteId,
          bookingStatus: "BOOKED",
          checkInDate: { lt: checkOut },
          checkOutDate: { gt: checkIn },
        },
      });
      if (overlap)
        throw new ConflictError("Updated dates overlap an existing booking");
    }

    // capacity checks if provided
    if (data.adults || data.children || data.pets) {
      const camp = await prisma.campSite.findUnique({
        where: { id: booking.campSiteId },
      });
      if (!camp) throw new NotFoundError("Campsite not found");

      if (
        data.adults &&
        data.adults > (camp.maxAdult ?? Number.MAX_SAFE_INTEGER)
      )
        throw new BadRequestError("Adults exceed campsite capacity");
      if (
        data.children &&
        data.children > (camp.maxChildren ?? Number.MAX_SAFE_INTEGER)
      )
        throw new BadRequestError("Children exceed campsite capacity");
      if (data.pets && data.pets > (camp.maxPets ?? Number.MAX_SAFE_INTEGER))
        throw new BadRequestError("Pets exceed campsite policy");
    }

    const updated = await prisma.campBookings.update({
      where: { id },
      data: {
        adults: data.adults ?? undefined,
        children: data.children ?? undefined,
        pets: data.pets ?? undefined,
        checkInDate: data.checkInDate ? new Date(data.checkInDate) : undefined,
        checkOutDate: data.checkOutDate
          ? new Date(data.checkOutDate)
          : undefined,
        bookingStatus: data.bookingStatus ?? undefined,
        paymentStatus: data.paymentStatus ?? undefined,
      },
    });

    return updated;
  }

  async cancelBooking(id, opts = { byUserId: null, reason: null }) {
    const existing = await prisma.campBookings.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Booking not found");

    // optionally: check permission: only the owner or admin can cancel
    if (opts.byUserId && existing.userId && opts.byUserId !== existing.userId) {
      // you might want to check admin role here
      // throw new ForbiddenError("Not allowed to cancel");
    }

    const cancelled = await prisma.campBookings.update({
      where: { id },
      data: { bookingStatus: "CANCELED" },
    });

    // Optionally: enqueue refund, send notifications

    return cancelled;
  }

  calculateNights(checkIn, checkOut) {
    const ms = new Date(checkOut) - new Date(checkIn);
    return Math.ceil(ms / (1000 * 60 * 60 * 24));
  }
}

export const bookingService = new BookingService();
