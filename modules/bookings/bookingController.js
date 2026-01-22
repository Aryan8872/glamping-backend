import * as bookingService from "./bookingService.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import prisma from "../../utils/prismaClient.js";

export const createBookingController = asyncHandler(async (req, res) => {
  const payload = req.validated || req.body;
  console.log(payload);

  const booking = await bookingService.createBooking(payload);
  return res.status(201).json({ message: "Booking created", data: booking });
});

export const updateBookingController = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const payload = req.validated || req.body;

  const updated = await bookingService.updateBooking(id, payload);
  return res.json({ message: "Booking updated", data: updated });
});

export const cancelBookingController = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const byUserId = req.user?.id ?? null;

  const cancelled = await bookingService.cancelBooking(id, {
    byUserId,
    reason: req.body?.reason,
  });
  return res.json({ message: "Booking cancelled", data: cancelled });
});

export const getBookingController = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const booking = await prisma.campBookings.findUnique({ where: { id } });
  if (!booking) return res.status(404).json({ message: "Not found" });
  return res.json({ message: "OK", data: booking });
});

export const getAllBookingController = asyncHandler(async (req, res) => {
  const { q, page, limit, status, checkIn, checkOut } = req.query;
  const result = await bookingService.searchBookings({
    q,
    page: Number(page) || 1,
    perPage: Number(limit) || 15,
    status,
    checkIn,
    checkOut,
  });

  return res.json({
    message: "Bookings fetched successfully",
    data: result.results,
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
    hasMore: result.hasMore,
  });
});
export const getCampAvailabilityController = asyncHandler(async (req, res) => {
  const campId = Number(req.params.campId);
  const { checkIn, checkOut } = req.query;

  if (!checkIn || !checkOut) {
    return res
      .status(400)
      .json({ message: "checkIn and checkOut are required" });
  }

  const availability = await bookingService.getCampAvailability(
    campId,
    new Date(checkIn),
    new Date(checkOut),
  );

  return res.json({
    message: "Availability fetched",
    data: availability,
  });
});
