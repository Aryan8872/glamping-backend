import * as adventureService from "./adventureService.js";
import {
  createAdventureSchema,
  updateAdventureSchema,
} from "./adventureValidation.js";
import { assignAdventureSchema } from "../../validation/adventureSchema.js";
import { mapFilesToPaths } from "../../utils/uploads/mapFiles.js";
import { ConflictError } from "../../utils/error.js";
export const getAllAdventuresController = async (req, res) => {
  const includeInactive = req.query.includeInactive === "true";
  const adventures = await adventureService.getAllAdventures(includeInactive);
  res.json({ data: adventures });
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
  const coverImagePaths = req.files?.adventureCoverImage
    ? mapFilesToPaths(req.files.adventureCoverImage)
    : [];
  const bannerImagePaths = req.files?.adventureBannerImage
    ? mapFilesToPaths(req.files.adventureBannerImage)
    : [];

  const slug = req.body.name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const rawData = {
    ...req.body,
    slug,
    coverImage: coverImagePaths[0] || "",
    bannerImage: bannerImagePaths[0] || "",
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
  const coverImage = req.files?.adventureCoverImage
    ? mapFilesToPaths(req.files?.adventureCoverImage)
    : null;
  const bannerImage = req.files?.adventureBannerImage
    ? mapFilesToPaths(req.files?.adventureBannerImage)
    : null;
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
    coverImage: coverImage ? coverImage[0] : null,
    bannerImage: bannerImage ? bannerImage[0] : null,
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
    adventureIds
  );
  res.json({ data: camp, message: "Adventures assigned successfully" });
};
