// controllers/booking.controller.js
import { bookingService } from "./bookingService.js";


export const createBookingController = async (req, res) => {
  // req.body expected to match createBookingSchema
  const payload = req.body;
  try {
    const booking = await bookingService.createBooking(payload);
    return res.status(201).json({ message: "Booking created", data: booking });
  } catch (err) {
    // let your global error middleware convert AppError into response
    // but if you don't have it, do minimal mapping:
    if (err.status) return res.status(err.status).json({ message: err.message, code: err.code, extras: err.extras });
    return res.status(500).json({ message: "Internal error", error: err.message });
  }
};

export const updateBookingController = async (req, res) => {
  const id = Number(req.params.id);
  const payload = req.body;
  try {
    const updated = await bookingService.updateBooking(id, payload);
    return res.json({ message: "Booking updated", data: updated });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message, code: err.code });
    return res.status(500).json({ message: "Internal error", error: err.message });
  }
};

export const cancelBookingController = async (req, res) => {
  const id = Number(req.params.id);
  // optionally read user id from auth middleware
  const byUserId = req.user?.id ?? null;
  try {
    const cancelled = await bookingService.cancelBooking(id, { byUserId, reason: req.body?.reason });
    return res.json({ message: "Booking cancelled", data: cancelled });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message, code: err.code });
    return res.status(500).json({ message: "Internal error", error: err.message });
  }
};

export const getBookingController = async (req, res) => {
  const id = Number(req.params.id);
  const booking = await bookingService.findById?.(id) || await prisma.campBookings.findUnique({ where: { id }});
  if (!booking) return res.status(404).json({ message: "Not found" });
  return res.json({ message: "OK", data: booking });
};
