import { z } from "zod";

export const createBlogSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  excerpt: z.string().min(10, "Excerpt must be at least 10 characters"),
  content: z.string().min(20, "Content must be at least 20 characters"),
  author: z.string().min(2, "Author name is required"),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  metaKeywords: z.string().optional(),
  tags: z.union([z.array(z.string()), z.string()]).optional(), // Handle array or comma-separated string
});

export const updateBlogStatusSchema = z.object({
  status: z.enum(["PUBLISHED", "DRAFT", "DELETED"]),
});
