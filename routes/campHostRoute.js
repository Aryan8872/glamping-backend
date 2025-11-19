import { Router } from "express";
import {
  createGalleryController,
  getGalleryBySlugController,
  getGalleryController,
  updateGalleryController,
} from "../controllers/galleryController.js";

const campHostRoute = Router();

campHostRoute.post("/gallery/new", createGalleryController);
campHostRoute.patch("/gallery/update/:galleryId", updateGalleryController);
campHostRoute.get("/gallery/all", getGalleryController);
campHostRoute.get("/gallery/:slug", getGalleryBySlugController);

export default campHostRoute;
