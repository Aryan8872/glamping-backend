import { z } from "zod";

export const createDiscountSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().optional(),
  type: z.enum(["PERCENTAGE", "FIXED"]),
  amount: z.coerce.number().positive("Amount must be positive"),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date().optional(),
  isFeatured: z.boolean().optional(),
  campId: z.coerce.number().optional(),
  adventureId: z.coerce.number().optional(),
});

export const updateDiscountSchema = createDiscountSchema.partial();
