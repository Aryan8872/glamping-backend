import * as aboutUsService from "./aboutUsService.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const getAboutUsController = asyncHandler(async (req, res) => {
  const aboutUs = await aboutUsService.getAboutUsService();
  res.json({ message: "About Us data", data: aboutUs });
});

export const createOrUpdateAboutUsController = asyncHandler(
  async (req, res) => {
    const data = req.validated || req.body;
    const aboutUs = await aboutUsService.createOrUpdateAboutUsService(data);
    res.json({ message: "About Us updated", data: aboutUs });
  }
);

export const updateAboutUsStatController = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const data = req.validated || req.body;
  const stat = await aboutUsService.updateAboutUsStat(id, data);
  res.json({ message: "Stat updated", data: stat });
});

export const deleteAboutUsStatController = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const stat = await aboutUsService.deleteAboutUsStat(id);
  res.json({ message: "Stat deleted", data: stat });
});
