import { z } from "zod";

export const createDestinationSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name too long"),
  slug: z.string().min(2, "Slug must be at least 2 characters").optional(),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .optional(),
  isFeatured: z
    .preprocess((val) => val === "true" || val === true, z.boolean())
    .optional(),
  isActive: z
    .preprocess((val) => val === "true" || val === true, z.boolean())
    .optional(),
});

export const updateDestinationSchema = createDestinationSchema.partial();

export const searchDestinationSchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  isActive: z
    .preprocess((val) => val === "true" || val === true, z.boolean())
    .optional(),
  isFeatured: z
    .preprocess((val) => val === "true" || val === true, z.boolean())
    .optional(),
});
