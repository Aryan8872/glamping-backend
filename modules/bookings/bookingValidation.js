import { z } from "zod";

export const createBookingSchema = z.object({
  checkInDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid check-in date",
  }),
  checkOutDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid check-out date",
  }),
  adults: z.coerce
    .number()
    .min(1, "At least 1 adult is required")
    .max(50, "Too many adults"),
  children: z.coerce
    .number()
    .min(0, "Children cannot be negative")
    .max(50, "Too many children")
    .optional(),
  pets: z.coerce
    .number()
    .min(0, "Pets cannot be negative")
    .max(10, "Too many pets")
    .optional(),
  campSiteId: z.coerce.number().positive("CampSite ID is required"),
  userId: z.coerce.number().optional(),
  guestUserFullName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .optional(),
  guestUserEmail: z.string().email("Invalid email address").optional(),
  guestUserPhoneNumber: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .optional(),
  totalPrice: z.coerce
    .number()
    .positive("Total price must be positive")
    .max(1000000, "Price too high"),
  paymentStatus: z.enum(["PENDING", "CLEARED"]).optional(),
});

export const updateBookingStatusSchema = z.object({
  bookingStatus: z.enum(["BOOKED", "CANCELED"]),
});

export const searchBookingSchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  bookingStatus: z.enum(["BOOKED", "CANCELED"]).optional(),
  paymentStatus: z.enum(["PENDING", "CLEARED"]).optional(),
  campSiteId: z.coerce.number().optional(),
  userId: z.coerce.number().optional(),
});
