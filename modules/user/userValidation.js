import { z } from "zod";

export const createUserSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z
    .string()
    .min(10, "Phone number must be at least 10 characters"),
  userType: z.enum(["ADMIN", "USER", "CAMPHOST", "SUPERADMIN"]).optional(),
  userStatus: z.enum(["DISABLED", "ENABLED"]).optional(),
  profilePicture: z.string().optional(),
});

export const updateUserSchema = createUserSchema.partial();
