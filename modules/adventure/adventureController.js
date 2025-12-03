import * as adventureService from "./adventureService.js";
import {
  createAdventureSchema,
  updateAdventureSchema,
  assignAdventureSchema,
} from "../../validation/adventureSchema.js";
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
  const coverImage = req.files?.coverImage[0]
    ? mapFilesToPaths(req.files?.coverImage[0])
    : null;
  const bannerImage = req.files?.bannerImage[0]
    ? mapFilesToPaths(req.files?.bannerImage[0])
    : null;

  const validatedData = createAdventureSchema.parse(req.body);
  const data = {
    ...validatedData,
    coverImage: coverImage,
    bannerImage: bannerImage,
  };
  const adventure = await adventureService.createAdventure(data);
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
    bannerImage: bannerImage?bannerImage[0]:null,
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
