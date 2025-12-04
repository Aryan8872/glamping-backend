import { z } from "zod";

export const createGallerySchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  category: z.string().optional(),
});

export const updateGallerySchema = createGallerySchema.partial();
