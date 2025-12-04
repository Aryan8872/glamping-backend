import { z } from "zod";

export const createCampSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  pricePerNight: z.coerce.number().min(0, "Price must be a positive number"),
  location: z.string().optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  hostId: z.coerce.number().optional(),
  facilities: z.array(z.any()).optional(), // Can be refined further if structure is known
  adventureIds: z
    .union([z.array(z.coerce.number()), z.coerce.number()])
    .optional(),
});

export const updateCampSchema = createCampSchema.partial().extend({
  removedImages: z.array(z.string()).optional(),
  newFacilities: z.array(z.any()).optional(),
});

export const searchCampSchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  facilityIds: z.string().optional(), // Comma separated
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  adults: z.coerce.number().optional(),
  children: z.coerce.number().optional(),
  pets: z.coerce.number().optional(),
  sort: z.enum(["relevance", "price_asc", "price_desc", "newest"]).optional(),
});
