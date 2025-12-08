import { z } from "zod";

export const createExperienceSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  isActive: z.boolean().optional().default(true),
  // icon is handled via file upload or string, validated in controller usually if file
});

export const updateExperienceSchema = z.object({
  title: z.string().optional(),
  slug: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});
