import { campSiteService } from "./campSite.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { mapFilesToPaths } from "../../utils/uploads/mapFiles.js";

export const createCampSite = asyncHandler(async (req, res) => {
  const body = req.body || {};
  console.log(req.body);
  const campImages = req.files?.campImages
    ? mapFilesToPaths(req.files?.campImages)
    : [];

  const payload = {
    ...body,
    images: campImages,
  };
  const newCamp = await campSiteService.createCampSite(payload);
  res.status(201).json({
    message: "CampSite created successfully",
    data: newCamp,
  });
});

export const getAllCampSites = asyncHandler(async (req, res) => {
  const camps = await campSiteService.getAllCampSites();
  res.json({ message: "CampSites fetched", data: camps });
});

export const getCampSiteById = asyncHandler(async (req, res) => {
  const camp = await campSiteService.getCampSiteById(Number(req.params.id));

  if (!camp) {
    return res.status(404).json({ message: "CampSite not found" });
  }

  res.json({ message: "CampSite found", data: camp });
});

export const updateCampSite = asyncHandler(async (req, res) => {
  const body = req.body || {};
  console.log(body)
  const removedImages = body.removedImages
    ? JSON.parse(body.removedImages)
    : [];
  const images = body.images ? JSON.parse(body.images) : [];

  const newImages = body.campImages ? mapFilesToPaths(req.files.campImages) : [];
  const camp = await campSiteService.updateCampSite(
    Number(req.params.id),
    {
      ...body,
      removedImages,
      images:images,
      newImages
    }
  );

  res.json({ message: "CampSite updated", data: camp });
});

export const deleteCampSite = asyncHandler(async (req, res) => {
  await campSiteService.deleteCampSite(Number(req.params.id));

  res.json({ message: "CampSite deleted successfully" });
});
