import { Router } from "express";
import {
  createGalleryController,
  getGalleryBySlugController,
  getGalleryController,
  updateGalleryController,
} from "./gallery.controller.js";
import { galleryUploadMiddleware } from "../../utils/uploads/multer.gallery.js";
import { multerErrorHandler } from "../../utils/uploads/multerErrors.js";

const galleryRoute = Router();

galleryRoute.post(
  "/gallery/new",
  galleryUploadMiddleware,
  multerErrorHandler,
  createGalleryController
);
galleryRoute.put(
  "/gallery/update/:slug",
  galleryUploadMiddleware,
  multerErrorHandler,
  updateGalleryController
);
galleryRoute.get("/gallery/all", getGalleryController);
galleryRoute.get("/gallery/:slug", getGalleryBySlugController);

export default galleryRoute;
