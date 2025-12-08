import prisma from "../../utils/prismaClient.js";
import {
  BadRequestError,
  NotFoundError,
  ConflictError,
} from "../../utils/error.js";
import { sendBookingConfirmationEmail } from "../../utils/email/emailService.js";

// Create booking (handles guest or registered user)
export const createBooking = async (validated) => {
  // Fetch camp with active discounts
  const camp = await prisma.campSite.findUnique({
    where: { id: validated.campSiteId },
    include: {
      discounts: {
        where: {
          active: true,
          startsAt: { lte: new Date() },
          OR: [{ endsAt: null }, { endsAt: { gte: new Date() } }],
        },
        orderBy: { startsAt: "desc" },
      },
      adventures: {
        select: { adventureId: true },
      },
    },
  });

  if (!camp) throw new NotFoundError("Campsite not found");

  // Fetch active discounts for linked adventures
  const adventureIds = camp.adventures.map((a) => a.adventureId);
  const adventureDiscounts = await prisma.discount.findMany({
    where: {
      adventureId: { in: adventureIds },
      active: true,
      startsAt: { lte: new Date() },
      OR: [{ endsAt: null }, { endsAt: { gte: new Date() } }],
    },
    orderBy: { startsAt: "desc" },
  });

  // Combine and sort discounts (Camp specific takes precedence or just most recent)
  const allDiscounts = [...camp.discounts, ...adventureDiscounts].sort(
    (a, b) => b.startsAt - a.startsAt
  );

  // dates
  const checkIn = new Date(validated.checkInDate);
  const checkOut = new Date(validated.checkOutDate);
  if (checkIn >= checkOut)
    throw new BadRequestError("checkInDate must be before checkOutDate");

  // overlapping booking check (inclusive-exclusive)
  const overlap = await prisma.campBookings.findFirst({
    where: {
      campSiteId: validated.campSiteId,
      bookingStatus: "BOOKED",
      checkInDate: { lt: checkOut },
      checkOutDate: { gt: checkIn },
    },
  });
  if (overlap)
    throw new ConflictError("Selected dates overlap with an existing booking");

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

  const nights = calculateNights(checkIn, checkOut);

  // Calculate Price with Discount
  let finalPricePerNight = Number(camp.pricePerNight);
  if (allDiscounts && allDiscounts.length > 0) {
    const d = allDiscounts[0];
    if (d.type === "PERCENTAGE") {
      finalPricePerNight =
        finalPricePerNight - (finalPricePerNight * d.amount) / 100;
    } else if (d.type === "FIXED") {
      finalPricePerNight = finalPricePerNight - d.amount;
    }
  }

  const totalPrice = Math.max(0, finalPricePerNight) * nights;

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

    return created;
  });

  // Send booking confirmation email (async, non-blocking)
  // Get user email - either from registered user or guest
  let recipientEmail = validated.guestUserEmail;
  let guestName = validated.guestUserFullName;

  if (validated.userId) {
    const user = await prisma.user.findUnique({
      where: { id: validated.userId },
      select: { email: true, fullName: true },
    });
    if (user) {
      recipientEmail = user.email;
      guestName = user.fullName;
    }
  }

  // Send email asynchronously (don't await - don't block booking response)
  if (recipientEmail) {
    sendBookingConfirmationEmail(
      {
        bookingId: booking.id,
        guestName: guestName,
        campSiteName: camp.name,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        adults: validated.adults,
        children: validated.children || 0,
        pets: validated.pets || 0,
        totalPrice: totalPrice,
        nights: nights,
      },
      recipientEmail
    ).catch((error) => {
      // Log error but don't fail the booking
      console.error("Email sending failed (non-critical):", error);
    });
  }

  return booking;
};

export const updateBooking = async (id, data) => {
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

    if (data.adults && data.adults > (camp.maxAdult ?? Number.MAX_SAFE_INTEGER))
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
      checkOutDate: data.checkOutDate ? new Date(data.checkOutDate) : undefined,
      bookingStatus: data.bookingStatus ?? undefined,
      paymentStatus: data.paymentStatus ?? undefined,
    },
  });

  return updated;
};

export const cancelBooking = async (
  id,
  opts = { byUserId: null, reason: null }
) => {
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
};

const calculateNights = (checkIn, checkOut) => {
  const ms = new Date(checkOut) - new Date(checkIn);
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
};
