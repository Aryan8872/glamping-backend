import { z } from "zod";

export const createUserSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Name too long"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .regex(/^[0-9+\-\s()]+$/, "Invalid phone number format"),
  userType: z.enum(["ADMIN", "USER", "CAMPHOST", "SUPERADMIN"]).optional(),
  userStatus: z.enum(["DISABLED", "ENABLED"]).optional(),
  profilePicture: z.string().optional(),
  isFeatured: z
    .preprocess((val) => val === "true" || val === true, z.boolean())
    .optional(),
  hostTagline: z.string().max(200, "Tagline too long").optional(),
  yearsOfExperience: z.coerce
    .number()
    .min(0, "Years of experience must be positive")
    .optional(),
});

export const updateUserSchema = createUserSchema.partial();

export const searchUserSchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  userType: z.enum(["ADMIN", "USER", "CAMPHOST", "SUPERADMIN"]).optional(),
  userStatus: z.enum(["DISABLED", "ENABLED"]).optional(),
  isFeatured: z
    .preprocess((val) => val === "true" || val === true, z.boolean())
    .optional(),
});
