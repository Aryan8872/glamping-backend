import express from "express";
import {
  createCampSite,
  getAllCampSites,
  getCampSiteById,
  updateCampSite,
  deleteCampSite,
} from "./campSite.controller.js";
import { multerErrorHandler } from "../../utils/uploads/multerErrors.js";
import { campUploadMiddleware } from "../../utils/uploads/multer.camp.js";

const campRoute = express.Router();

campRoute.post(
  "/camp/new",
  campUploadMiddleware,
  multerErrorHandler,
  createCampSite
);
campRoute.get("/camp/all", getAllCampSites);
campRoute.get("/camp/:id", getCampSiteById);
campRoute.put(
  "/camp/:id",
  campUploadMiddleware,
  multerErrorHandler,
  updateCampSite
);
campRoute.delete("/camp/:id", deleteCampSite);

export default campRoute;
