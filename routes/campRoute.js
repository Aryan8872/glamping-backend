import express from "express";
import {
  createCampSite,
  getAllCampSites,
  getCampSiteById,
  updateCampSite,
  deleteCampSite,
} from "../controllers/campSite.controller.js";

const campRoute = express.Router();

campRoute.post("/camp/new", createCampSite);
campRoute.get("/camp/all", getAllCampSites);
campRoute.get("/camp/:id", getCampSiteById);
campRoute.patch("/camp/:id", updateCampSite);
campRoute.delete("/camp/:id", deleteCampSite);

export default campRoute;
