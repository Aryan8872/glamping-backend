import { z } from 'zod';

export const createDestinationSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100, 'Name too long'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title too long'),
  pageDescription: z.string().min(10, 'Page description must be at least 10 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters').optional(),
  imageUrl: z.string().optional(),
  bannerUrl: z.string().optional(),
  isActive: z.preprocess((val) => val === 'true' || val === true, z.boolean()).optional().default(true),
  isFeatured: z.preprocess((val) => val === 'true' || val === true, z.boolean()).optional(),
});

export const updateDestinationSchema = createDestinationSchema.partial();

export const searchDestinationSchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  isActive: z.preprocess((val) => val === 'true' || val === true, z.boolean()).optional(),
  isFeatured: z.preprocess((val) => val === 'true' || val === true, z.boolean()).optional(),
});
