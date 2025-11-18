import { Router } from "express";
import { createGalleryController, getGalleryByIdController, getGalleryController, updateGalleryController } from "../controllers/galleryController.js";

const galleryRoute = Router()

galleryRoute.post("/gallery/new",createGalleryController)
galleryRoute.patch("/gallery/update/:galleryId",updateGalleryController)
galleryRoute.get("/gallery/all",getGalleryController)
galleryRoute.get("/gallery/:galleryId",getGalleryByIdController)


export default galleryRoute