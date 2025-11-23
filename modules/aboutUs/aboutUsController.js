import {
  createOrUpdateAboutUsService,
  deleteAboutUsStat,
  getAboutUsService,
  updateAboutUsStat,
} from "./aboutUsService.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const getAboutUs = asyncHandler(async (req, res) => {
  const aboutUs = await getAboutUsService();
  res.json({ message: "AboutUs fetched", data: aboutUs });
});
export const updateAboutUsStatController = asyncHandler(async (req, res) => {
  const statId = parseInt(req.params.statId);
  const aboutUs = await updateAboutUsStat(statId, req.body);
  res.json({ message: "AboutUs stats updated", data: aboutUs });
});
export const createOrUpdateAboutUs = asyncHandler(async (req, res) => {
  const aboutUs = await createOrUpdateAboutUsService(req.body);
  res.json({ message: "AboutUs updated successfully", data: aboutUs });
});

export const deleteAboutUsStatController = asyncHandler(async (req, res) => {
  const statId = parseInt(req.params.statId);
  const aboutUs = await deleteAboutUsStat(statId, req.body);
  res.json({ message: "AboutUs stats deleted", data: aboutUs });
});