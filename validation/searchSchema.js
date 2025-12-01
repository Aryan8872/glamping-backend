import { z } from 'zod';

  export const searchQuerySchema = z.object({
    q: z.string().optional(),
    page: z.string().optional(),
    perPage: z.string().optional(),
    minPrice: z.string().optional(),
    maxPrice: z.string().optional(),
    facilityIds: z.string().optional(), // comma separated
    checkIn: z.string().optional(),
    checkOut: z.string().optional(),
    adults: z.string().optional(),
    children: z.string().optional(),
    pets: z.string().optional(),
    sort: z.string().optional()
  });