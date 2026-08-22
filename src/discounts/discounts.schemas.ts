import { z } from 'zod';

export const createDiscountSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100, 'Name too long'),
  description: z.string().min(10, 'Description must be at least 10 characters').optional(),
  type: z.enum(['PERCENTAGE', 'FIXED']),
  amount: z.coerce.number().positive('Amount must be positive').max(100000, 'Amount too high'),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date().optional(),
  active: z.preprocess((val) => val === 'true' || val === true, z.boolean()).optional(),
  isFeatured: z.preprocess((val) => val === 'true' || val === true, z.boolean()).optional(),
  campId: z.coerce.number().optional(),
  adventureId: z.coerce.number().optional(),
});

export const updateDiscountSchema = createDiscountSchema.partial();

export const searchDiscountSchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  type: z.enum(['PERCENTAGE', 'FIXED']).optional(),
  active: z.preprocess((val) => val === 'true' || val === true, z.boolean()).optional(),
});
