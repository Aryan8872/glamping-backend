import express from "express";
import {
  createCampSite,
  getAllCampSites,
  getCampSiteById,
  updateCampSite,
  deleteCampSite,
  searchCampsController,
} from "./campSite.controller.js";
import { multerErrorHandler } from "../../utils/uploads/multerErrors.js";
import { campUploadMiddleware } from "../../utils/uploads/multer.camp.js";
import validate from "../../middleware/validate.js";
import { searchQuerySchema } from "../../validation/searchSchema.js";

const campRoute = express.Router();

campRoute.post(
  "/camp/new",
  campUploadMiddleware,
  multerErrorHandler,
  createCampSite
);
campRoute.get("/camp/all", getAllCampSites);

// ✅ MOVE THIS UP (Before /:id)
campRoute.get('/camp/search', validate(searchQuerySchema, { in: 'query' }), searchCampsController);

// ⬇️ ID route must be AFTER specific routes like /search, /all, etc.
campRoute.get("/camp/:id", getCampSiteById);

campRoute.put(
  "/camp/:id",
  campUploadMiddleware,
  multerErrorHandler,
  updateCampSite
);
campRoute.delete("/camp/:id", deleteCampSite);

export default campRoute;
