import { z } from "zod";
export const updateContactSchema = z.object({
  email: z.string().email("Invalid email").optional(),
  phoneNumber: z.string().min(1, "Phone number is required").optional(),
  address: z.string().min(1, "Address is required").optional(),
});