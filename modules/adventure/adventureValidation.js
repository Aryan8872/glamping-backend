import { z } from "zod";

export const createAdventureSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  title: z.string().min(3, "Title must be at least 3 characters"),
  pageDescription: z
    .string()
    .min(10, "Page description must be at least 10 characters"),
  isActive: z.boolean().optional(),
});

export const updateAdventureSchema = createAdventureSchema.partial();
