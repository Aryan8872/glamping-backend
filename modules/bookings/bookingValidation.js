import { z } from "zod";

export const createBookingSchema = z.object({
  checkInDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid check-in date",
  }),
  checkOutDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid check-out date",
  }),
  adults: z.coerce.number().min(1, "At least 1 adult is required"),
  children: z.coerce.number().min(0).optional(),
  pets: z.coerce.number().min(0).optional(),
  campSiteId: z.coerce.number().positive("CampSite ID is required"),
  userId: z.coerce.number().optional(),
  guestUserFullName: z.string().optional(),
  guestUserEmail: z.string().email().optional(),
  guestUserPhoneNumber: z.string().optional(),
  totalPrice: z.coerce.number().positive("Total price must be positive"),
});

export const updateBookingStatusSchema = z.object({
  bookingStatus: z.enum(["BOOKED", "CANCELED"]),
});
