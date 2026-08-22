import { z } from 'zod';

export const createFacilitySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  icon: z.string().optional(),
  description: z.string().optional(),
});

export const updateFacilitySchema = createFacilitySchema.partial();
