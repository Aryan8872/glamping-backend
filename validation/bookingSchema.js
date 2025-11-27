// validation/bookingSchema.js
import z from "zod";

export const createBookingSchema = z.object({
  campSiteId: z.number().int().positive(),
  userId: z.number().int().positive().optional(), // optional for guest bookings
  checkInDate: z.string().refine((s) => !Number.isNaN(Date.parse(s)), { message: "Invalid checkInDate" }),
  checkOutDate: z.string().refine((s) => !Number.isNaN(Date.parse(s)), { message: "Invalid checkOutDate" }),
  adults: z.number().int().min(1).optional().default(1),
  children: z.number().int().min(0).optional().default(0),
  pets: z.number().int().min(0).optional().default(0),
  // guest info required if userId absent — validated in service
  guestUserFullName: z.string().optional(),
  guestUserEmail: z.string().email().optional(),
  guestUserPhoneNumber: z.string().optional(),
  // optional payment / meta
  paymentReference: z.string().optional(),
});

export const updateBookingSchema = z.object({
  adults: z.number().int().min(1).optional(),
  children: z.number().int().min(0).optional(),
  pets: z.number().int().min(0).optional(),
  checkInDate: z.string().optional(),
  checkOutDate: z.string().optional(),
  bookingStatus: z.enum(["BOOKED", "CANCELED"]).optional(),
  paymentStatus: z.enum(["PENDING", "CLEARED"]).optional(),
});
