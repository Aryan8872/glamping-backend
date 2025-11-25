import path from "path";
import {
  createGalleryService,
  updateGalleryService,
  getGalleryService,
  getGalleryBySlugService,
  updateGalleryStatusService,
  deleteGalleryService,
} from "./gallery.service.js";
import { toPublicPath } from "../../utils/uploads/storage.utils.js";
import { mapFilesToPaths } from "../../utils/uploads/mapFiles.js";

/**
 * Convert multer files to public paths
 */


export const createGalleryController = async (req, res, next) => {
  try {
    const body = req.body || {};
    console.log(body)
    const coverImage = req.files?.coverImage?.[0]
      ? mapFilesToPaths([req.files.coverImage[0]])[0]
      : null;
    const galleryImages = req.files?.galleryImage
      ? mapFilesToPaths(req.files.galleryImage)
      : [];

    const payload = {
      ...body,
      coverImage,
      images: galleryImages,
    };

    const gallery = await createGalleryService(payload);
    return res.status(201).json({ message: "Gallery created", data: gallery });
  } catch (err) {
    next(err);
  }
};

export const updateGalleryController = async (req, res, next) => {
  try {
    console.log("request body in gallery",req.body)
    const slug = req.params.slug;
    if (!slug) return res.status(400).json({ message: "slug is required" });

    const body = req.body || {};

    // Parse arrays sent from frontend
    const removedImages = body.removedImages ? JSON.parse(body.removedImages) : [];
    const existingImages = body.images ? JSON.parse(body.images) : [];

    const newImages = req.files?.galleryImage ? mapFilesToPaths(req.files.galleryImage) : [];
    const coverImage = req.files?.coverImage?.[0]
      ? mapFilesToPaths([req.files.coverImage[0]])[0]
      : null;

    const updatePayload = {
      ...body,
      removedImages,
      images: existingImages,
      newImages,
      coverImage,
    };

    const updated = await updateGalleryService(slug, updatePayload);
    return res.status(200).json({ message: "Gallery updated", data: updated });
  } catch (err) {
    next(err);
  }
};

export const getGalleryController = async (req, res, next) => {
  try {
    const galleries = await getGalleryService();
    return res.status(200).json({ message: "Gallery data", data: galleries });
  } catch (err) {
    next(err);
  }
};
export const delteGalleryController = async (req, res, next) => {
  try {
    const galleryId = parseInt(req.params.galleryId)
     await deleteGalleryService(galleryId);
    return res.status(200).json({ message: "deleted gallery successfully", data: [] });
  } catch (err) {
    next(err);
  }
};

export const getGalleryBySlugController = async (req, res, next) => {
  try {
    const slug = req.params.slug;
    if (!slug) return res.status(400).json({ message: "slug required" });

    const gallery = await getGalleryBySlugService(slug);
    if (!gallery) return res.status(404).json({ message: "Not found" });

    return res.status(200).json({ message: "Gallery by slug", data: gallery });
  } catch (err) {
    next(err);
  }
};

export const updateGalleryStatusController = async (req, res, next) => {
  try {
    const slug = req.params.slug;
    const status = req.params.status;

    const result = await updateGalleryStatusService(slug, status);
    if (!result) return res.status(400).json({ message: "Invalid status or gallery not found" });

    return res.status(200).json({ message: "Gallery status updated", data: result });
  } catch (err) {
    next(err);
  }
};
