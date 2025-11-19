import { Router } from "express";
import {
  createGalleryController,
  getGalleryBySlugController,
  getGalleryController,
  updateGalleryController,
} from "../controllers/galleryController.js";

const facilityRoute = Router();

facilityRoute.post("/gallery/new", createGalleryController);
facilityRoute.patch("/gallery/update/:galleryId", updateGalleryController);
facilityRoute.get("/gallery/all", getGalleryController);
facilityRoute.get("/gallery/:slug", getGalleryBySlugController);

export default facilityRoute;
