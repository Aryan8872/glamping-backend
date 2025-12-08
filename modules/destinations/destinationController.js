import * as destinationService from "./destinationService.js";
import { z } from "zod"; // validation inline or sep
import { mapFilesToPaths } from "../../utils/uploads/mapFiles.js";

// Basic Schema
const destinationSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const getAllDestinationsController = async (req, res) => {
  const includeInactive = req.query.includeInactive === "true";
  const destinations = await destinationService.getAllDestinations(
    includeInactive
  );
  res.json({ data: destinations });
};

export const getDestinationByIdController = async (req, res) => {
  const { id } = req.params;
  const destination = await destinationService.getDestinationById(id);
  res.json({ data: destination });
};

export const createDestinationController = async (req, res) => {
  // Frontend sends "imageUrl"
  const imagePaths = req.files?.imageUrl
    ? mapFilesToPaths(req.files.imageUrl)
    : [];

  const slug = req.body.name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const rawData = {
    ...req.body,
    slug: req.body.slug || slug,
    isFeatured: req.body.isFeatured === "true" || req.body.isFeatured === true,
    isActive: req.body.isActive === "true" || req.body.isActive === true,
  };

  const validated = destinationSchema.safeParse(rawData);
  if (!validated.success) {
    return res.status(400).json({ errors: validated.error.issues });
  }

  const payload = {
    ...validated.data,
    imageUrl: imagePaths[0] || null,
  };

  const destination = await destinationService.createDestination(payload);
  res.status(201).json({ data: destination, message: "Destination created" });
};

export const updateDestinationController = async (req, res) => {
  const { id } = req.params;
  const imagePaths = req.files?.imageUrl
    ? mapFilesToPaths(req.files.imageUrl)
    : null;

  const rawData = { ...req.body };
  if (req.body.isFeatured !== undefined)
    rawData.isFeatured =
      req.body.isFeatured === "true" || req.body.isFeatured === true;
  if (req.body.isActive !== undefined)
    rawData.isActive =
      req.body.isActive === "true" || req.body.isActive === true;

  // For update, fields are optional
  const updateSchema = destinationSchema.partial();
  const validated = updateSchema.safeParse(rawData);
  if (!validated.success) {
    return res.status(400).json({ errors: validated.error.issues });
  }

  const payload = {
    ...validated.data,
    ...(imagePaths ? { imageUrl: imagePaths[0] } : {}),
  };

  const destination = await destinationService.updateDestination(id, payload);
  res.json({ data: destination, message: "Destination updated" });
};

export const deleteDestinationController = async (req, res) => {
  await destinationService.deleteDestination(req.params.id);
  res.json({ message: "Destination deleted" });
};
