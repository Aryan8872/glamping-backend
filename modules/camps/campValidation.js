import { z } from "zod";

const jsonParseSchema = z.preprocess((val) => {
  if (typeof val === "string") {
    try {
      return JSON.parse(val);
    } catch {
      return val;
    }
  }
  return val;
}, z.any());

export const createCampSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  pricePerNight: z.coerce.number().min(0, "Price must be a positive number"),
  location: z.string().optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  hostId: z.coerce.number().optional(),
  facilities: jsonParseSchema.pipe(z.array(z.any()).optional()),
  adventureIds: jsonParseSchema.pipe(
    z.union([z.array(z.coerce.number()), z.coerce.number()]).optional(),
  ),
  experienceIds: jsonParseSchema.pipe(
    z.union([z.array(z.coerce.number()), z.coerce.number()]).optional(),
  ),
  maxAdult: z.coerce.number().optional().default(0),
  maxChildren: z.coerce.number().optional().default(0),
  maxPets: z.coerce.number().optional().default(0),
  isFeatured: z
    .preprocess((val) => val === "true" || val === true, z.boolean())
    .optional(),
});

export const updateCampSchema = createCampSchema.partial().extend({
  removedImages: jsonParseSchema.pipe(z.array(z.string()).optional()),
  newFacilities: jsonParseSchema.pipe(z.array(z.any()).optional()),
  images: jsonParseSchema.pipe(z.array(z.string()).optional()),
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
