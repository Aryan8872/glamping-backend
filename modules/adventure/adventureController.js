import * as adventureService from "./adventureService.js";
import {
  createAdventureSchema,
  updateAdventureSchema,
} from "./adventureValidation.js";
import { assignAdventureSchema } from "../../validation/adventureSchema.js";
import { processSingleFile } from "../../utils/uploads/uploadAdapter.js";
import { ConflictError } from "../../utils/error.js";
export const getAllAdventuresController = async (req, res) => {
  const { q, page, limit, isActive } = req.query;
  const result = await adventureService.searchAdventures({
    q,
    page: Number(page) || 1,
    perPage: Number(limit) || 15,
    isActive,
  });

  res.json({
    message: "Adventures fetched successfully",
    data: result.results,
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
    hasMore: result.hasMore,
  });
};
export const getAdventureByIdController = async (req, res) => {
  const { id } = req.params;
  const adventure = await adventureService.getAdventureById(id);
  res.json({ data: adventure });
};
export const getAdventureBySlugController = async (req, res) => {
  const { slug } = req.params;
  const adventure = await adventureService.getAdventureBySlug(slug);
  res.json({ data: adventure });
};
export const createAdventureController = async (req, res) => {
  const coverImagePath = await processSingleFile(
    req.files?.adventureCoverImage?.[0],
    "adventure",
  );
  const bannerImagePath = await processSingleFile(
    req.files?.adventureBannerImage?.[0],
    "adventure",
  );

  const slug = req.body.name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const rawData = {
    ...req.body,
    slug,
    slug,
    coverImage: coverImagePath || "",
    bannerImage: bannerImagePath || "",
  };
  const validatedData = createAdventureSchema.safeParse(rawData);

  if (!validatedData.success) {
    const errorMessages = validatedData.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
      code: issue.code,
    }));
    return res.status(400).json({
      message: "Validation Error",
      errors: errorMessages,
    });
  }

  const adventure = await adventureService.createAdventure(validatedData.data);
  res
    .status(201)
    .json({ data: adventure, message: "Adventure created successfully" });
};
export const updateAdventureController = async (req, res) => {
  const data = req.body || {};
  console.log("update data at controller", req.body);
  const id = parseInt(req.params.id);
  console.log("files", req.files);

  const coverImage = await processSingleFile(
    req.files?.adventureCoverImage?.[0],
    "adventure",
  );
  const bannerImage = await processSingleFile(
    req.files?.adventureBannerImage?.[0],
    "adventure",
  );
  data["isActive"] = JSON.parse(data["isActive"]);
  const validatedData = updateAdventureSchema.safeParse(data);
  if (!validatedData.success) {
    throw new ConflictError(`${validatedData.error}`);
  }

  console.log("banner image", bannerImage);
  console.log("cover image", coverImage);
  const parsedData = validatedData.data;
  const payload = {
    ...parsedData,
    coverImage: coverImage || null,
    bannerImage: bannerImage || null,
  };
  const adventure = await adventureService.updateAdventure(id, payload);
  res.json({ data: adventure, message: "Adventure updated successfully" });
};

export const deleteAdventureController = async (req, res) => {
  const { id } = req.params;
  await adventureService.deleteAdventure(id);
  res.json({ message: "Adventure deleted successfully" });
};
export const assignAdventuresToCampController = async (req, res) => {
  const { campId } = req.params;
  const { adventureIds } = assignAdventureSchema.parse(req.body);
  const camp = await adventureService.assignAdventuresToCamp(
    campId,
    adventureIds,
  );
  res.json({ data: camp, message: "Adventures assigned successfully" });
};
