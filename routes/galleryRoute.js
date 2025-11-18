import { Router } from "express";
import {
  createGalleryController,
  getGalleryBySlugController,
  getGalleryController,
  updateGalleryController,
} from "../controllers/galleryController.js";

const galleryRoute = Router();

galleryRoute.post("/gallery/new", createGalleryController);
galleryRoute.patch("/gallery/update/:galleryId", updateGalleryController);
galleryRoute.get("/gallery/all", getGalleryController);
galleryRoute.get("/gallery/:slug", getGalleryBySlugController);

export default galleryRoute;
