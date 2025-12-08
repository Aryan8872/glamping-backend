import { z } from "zod";

export const createAdventureSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  title: z.string().min(3, "Title must be at least 3 characters"),
  pageDescription: z
    .string()
    .min(10, "Page description must be at least 10 characters"),
  slug: z.string().min(1, "Slug is required"),
  coverImage: z.string().optional(),
  bannerImage: z.string().optional(),
  isActive: z.preprocess((val) => {
    if (val === "true") return true;
    if (val === "false") return false;
    return val;
  }, z.boolean().optional().default(true)),
});

export const updateAdventureSchema = createAdventureSchema.partial();
