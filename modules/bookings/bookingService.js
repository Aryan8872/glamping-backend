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
    (a, b) => b.startsAt - a.startsAt,
  );

  // dates
  const checkIn = new Date(validated.checkInDate);
  const checkOut = new Date(validated.checkOutDate);
  if (checkIn >= checkOut)
    throw new BadRequestError("checkInDate must be before checkOutDate");

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

  // Wrap everything in a single transaction to prevent race conditions
  const result = await prisma.$transaction(async (tx) => {
    // 1. Calculate capacity per day within transaction
    const availability = await getCampAvailability(
      validated.campSiteId,
      checkIn,
      checkOut,
      null,
      tx,
    );

    const requestedGuests = validated.adults + validated.children;
    const isAvailable = availability.every(
      (day) => day.remainingSlots >= requestedGuests,
    );

    if (!isAvailable) {
      throw new ConflictError(
        "Requested number of guests exceeds available capacity for one or more dates in the stay",
      );
    }

    // 2. Initial capacity checks (static policy)
    if (validated.adults > (camp.maxAdult ?? Number.MAX_SAFE_INTEGER))
      throw new BadRequestError("Adults exceed campsite capacity");
    if (validated.children > (camp.maxChildren ?? Number.MAX_SAFE_INTEGER))
      throw new BadRequestError("Children exceed campsite capacity");
    if (validated.pets > (camp.maxPets ?? Number.MAX_SAFE_INTEGER))
      throw new BadRequestError("Pets exceed campsite policy");

    // 3. Create the booking record
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

    return { booking: created, camp };
  });

  const { booking } = result;

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
      recipientEmail,
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

  const updated = await prisma.$transaction(async (tx) => {
    // If dates or guest counts changed, validate capacity within transaction
    if (
      data.checkInDate ||
      data.checkOutDate ||
      data.adults !== undefined ||
      data.children !== undefined
    ) {
      const checkIn = data.checkInDate
        ? new Date(data.checkInDate)
        : booking.checkInDate;
      const checkOut = data.checkOutDate
        ? new Date(data.checkOutDate)
        : booking.checkOutDate;
      const adults = data.adults !== undefined ? data.adults : booking.adults;
      const children =
        data.children !== undefined ? data.children : booking.children;

      if (checkIn >= checkOut) {
        throw new BadRequestError("checkInDate must be before checkOutDate");
      }

      const availability = await getCampAvailability(
        booking.campSiteId,
        checkIn,
        checkOut,
        id,
        tx,
      );

      const requestedGuests = adults + children;
      const isAvailable = availability.every(
        (day) => day.remainingSlots >= requestedGuests,
      );

      if (!isAvailable) {
        throw new ConflictError(
          "Requested update exceeds available capacity for one or more dates",
        );
      }
    }

    // Static capacity checks if provided
    if (data.adults || data.children || data.pets) {
      const camp = await tx.campSite.findUnique({
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

    return await tx.campBookings.update({
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
  });

  return updated;
};

export const cancelBooking = async (
  id,
  opts = { byUserId: null, reason: null },
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

export const searchBookings = async ({
  q,
  page = 1,
  perPage = 10,
  status,
  checkIn,
  checkOut,
}) => {
  const take = Math.max(1, Number(perPage) || 10);
  const skip = (Math.max(1, Number(page)) - 1) * take;

  const where = {};
  if (q) {
    where.OR = [
      { guestUserFullName: { contains: q, mode: "insensitive" } },
      { guestUserEmail: { contains: q, mode: "insensitive" } },
      { campSite: { name: { contains: q, mode: "insensitive" } } },
      { userInfo: { fullName: { contains: q, mode: "insensitive" } } },
    ];
  }
  if (status) where.bookingStatus = status;
  if (checkIn) where.checkInDate = { gte: new Date(checkIn) };
  if (checkOut) where.checkOutDate = { lte: new Date(checkOut) };

  const [total, results] = await Promise.all([
    prisma.campBookings.count({ where }),
    prisma.campBookings.findMany({
      where,
      take,
      skip,
      include: {
        campSite: { select: { name: true, slug: true } },
        userInfo: { select: { fullName: true, email: true } },
      },
      orderBy: { id: "desc" },
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
};

export const getCampAvailability = async (
  campId,
  startDate,
  endDate,
  ignoreBookingId = null,
  tx = null,
) => {
  const client = tx || prisma;
  const camp = await client.campSite.findUnique({
    where: { id: campId },
    select: { maxAdult: true, maxChildren: true },
  });

  if (!camp) throw new Error("Camp not found");
  const totalSlots = (camp.maxAdult || 0) + (camp.maxChildren || 0);

  // Fetch all active bookings that overlap with the range
  const bookings = await client.campBookings.findMany({
    where: {
      campSiteId: campId,
      bookingStatus: "BOOKED",
      id: ignoreBookingId ? { not: ignoreBookingId } : undefined,
      checkInDate: { lt: endDate },
      checkOutDate: { gt: startDate },
    },
    select: {
      checkInDate: true,
      checkOutDate: true,
      adults: true,
      children: true,
    },
  });

  const dailyAvailability = [];
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
    const currentDay = new Date(d);

    // Sum guests for bookings that cover this specific night
    const bookedGuests = bookings
      .filter((b) => {
        const bIn = new Date(b.checkInDate);
        bIn.setHours(0, 0, 0, 0);
        const bOut = new Date(b.checkOutDate);
        bOut.setHours(0, 0, 0, 0);
        return currentDay >= bIn && currentDay < bOut;
      })
      .reduce((sum, b) => sum + b.adults + b.children, 0);

    dailyAvailability.push({
      date: currentDay.toISOString().split("T")[0],
      bookedGuests,
      remainingSlots: Math.max(0, totalSlots - bookedGuests),
      totalSlots,
      isFullyBooked: bookedGuests >= totalSlots,
    });
  }

  return dailyAvailability;
};

const calculateNights = (checkIn, checkOut) => {
  const ms = new Date(checkOut) - new Date(checkIn);
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
};
