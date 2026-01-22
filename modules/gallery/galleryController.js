import * as galleryService from "./galleryService.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  processUploadedFiles,
  processSingleFile,
} from "../../utils/uploads/uploadAdapter.js";
import { safeParseArray } from "../../utils/safeParseArray.js";

export const createGalleryController = asyncHandler(async (req, res) => {
  const body = req.validated || req.body || {};

  const coverImage = await processSingleFile(
    req.files?.coverImage?.[0],
    "gallery",
  );

  const galleryImages = await processUploadedFiles(
    req.files?.galleryImage,
    "gallery",
  );

  const payload = {
    ...body,
    coverImage,
    images: galleryImages,
  };

  const gallery = await galleryService.createGalleryService(payload);
  return res.status(201).json({ message: "Gallery created", data: gallery });
});

export const updateGalleryController = asyncHandler(async (req, res) => {
  const slug = req.params.slug;
  if (!slug) return res.status(400).json({ message: "slug is required" });

  const body = req.validated || req.body || {};
  console.log("body", body);
  console.log("files", req.files);
  console.log("Content-Type:", req.headers["content-type"]);
  // Parse arrays sent from frontend
  const removedImages = safeParseArray(body.removedImages);
  const existingImages = safeParseArray(body.images);

  const newImages = await processUploadedFiles(
    req.files?.galleryImage,
    "gallery",
  );
  const coverImage = await processSingleFile(
    req.files?.coverImage?.[0],
    "gallery",
  );

  const updatePayload = {
    ...body,
    removedImages,
    images: existingImages,
    newImages,
    coverImage,
  };

  const updated = await galleryService.updateGalleryService(
    slug,
    updatePayload,
  );
  return res.status(200).json({ message: "Gallery updated", data: updated });
});

export const getGalleryController = asyncHandler(async (req, res) => {
  const { q, page, limit, status } = req.query;
  const result = await galleryService.searchGalleries({
    q,
    page: Number(page) || 1,
    perPage: Number(limit) || 15,
    status,
  });

  return res.status(200).json({
    message: "Galleries fetched successfully",
    data: result.results,
    total: result.total,
    page: result.page,
    perPage: result.perPage,
  });
});

export const deleteGalleryController = asyncHandler(async (req, res) => {
  const galleryId = parseInt(req.params.galleryId);
  await galleryService.deleteGalleryService(galleryId);
  return res
    .status(200)
    .json({ message: "deleted gallery successfully", data: [] });
});

export const getGalleryBySlugController = asyncHandler(async (req, res) => {
  const slug = req.params.slug;
  if (!slug) return res.status(400).json({ message: "slug required" });

  const gallery = await galleryService.getGalleryBySlugService(slug);
  if (!gallery) return res.status(404).json({ message: "Not found" });

  return res.status(200).json({ message: "Gallery by slug", data: gallery });
});

export const updateGalleryStatusController = asyncHandler(async (req, res) => {
  const slug = req.params.slug;
  const status = req.params.status;

  const result = await galleryService.updateGalleryStatusService(slug, status);
  if (!result)
    return res
      .status(400)
      .json({ message: "Invalid status or gallery not found" });

  return res
    .status(200)
    .json({ message: "Gallery status updated", data: result });
});
