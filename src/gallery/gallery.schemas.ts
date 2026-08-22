import { z } from 'zod';

const jsonParseSchema = z.preprocess((val) => {
  if (typeof val === 'string') {
    try {
      return JSON.parse(val);
    } catch {
      return val;
    }
  }
  return val;
}, z.any());

export const createGallerySchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title too long'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  excerpt: z
    .string()
    .min(10, 'Excerpt must be at least 10 characters')
    .max(500, 'Excerpt too long'),
  slug: z.string().min(3, 'Slug must be at least 3 characters').optional(),
  metaTitle: z
    .string()
    .max(60, 'Meta title should be under 60 characters')
    .optional(),
  metaDescription: z
    .string()
    .max(160, 'Meta description should be under 160 characters')
    .optional(),
  metaKeywords: z.string().optional(),
  imageAlt: z.string().optional(),
  galleryStatus: z.enum(['PUBLISHED', 'DRAFT', 'DELETED']).optional(),
});

export const updateGallerySchema = createGallerySchema.partial().extend({
  images: jsonParseSchema.pipe(z.array(z.string()).optional()),
  removedImages: jsonParseSchema.pipe(z.array(z.string()).optional()),
});
