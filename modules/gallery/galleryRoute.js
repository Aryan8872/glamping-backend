import { Router } from "express";
import {
  createGalleryController,
  updateGalleryController,
  getGalleryController,
  getGalleryBySlugController,
  updateGalleryStatusController,
  deleteGalleryController,
} from "./galleryController.js";

import {
  createGallerySchema,
  updateGallerySchema,
} from "./galleryValidation.js";
import createMulter from "../../utils/uploads/multerFactory.js";

const galleryRoute = Router();
const upload = createMulter("gallery", {
  allowedTypes: ["image/jpeg", "image/png", "image/webp"],
  maxSizeBytes: 20 * 1024 * 1024,
});

galleryRoute.post(
  "/gallery/new",
  upload.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "galleryImage", maxCount: 10 },
  ]),

  createGalleryController
);

galleryRoute.get("/gallery/all", getGalleryController);
galleryRoute.get("/gallery/:slug", getGalleryBySlugController);

galleryRoute.put(
  "/gallery/:slug",
  upload.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "galleryImage", maxCount: 10 },
  ]),

  updateGalleryController
);

galleryRoute.patch("/gallery/:slug/:status", updateGalleryStatusController);
galleryRoute.delete("/gallery/:galleryId", deleteGalleryController);

export default galleryRoute;
