import { z } from "zod";
export const createAdventureSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().min(1, "Description is required"),
  coverImage: z.string().min(1, "Cover image is required"),
  bannerImage: z.string().min(1, "Banner image is required"),
  title: z.string().min(1, "Title is required"),
  pageDescription: z.string().min(1, "Page description is required"),
  isActive: z.boolean().optional().default(true),
});
export const updateAdventureSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().optional(),
  coverImage: z.string().optional(),
  bannerImage: z.string().optional(),
  title: z.string().optional(),
  pageDescription: z.string().optional(),
  isActive: z.boolean().optional(),
});
export const assignAdventureSchema = z.object({
  campId: z.number().int().positive(),
  adventureIds: z.array(z.number().int().positive()),
});