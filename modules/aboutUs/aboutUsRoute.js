import { Router } from "express";
import {
  getAboutUsController,
  createOrUpdateAboutUsController,
  updateAboutUsStatController,
  deleteAboutUsStatController,
} from "./aboutUsController.js";

import { updateAboutUsSchema } from "./aboutUsValidation.js";

const aboutUsRoute = Router();

aboutUsRoute.get("/aboutus", getAboutUsController);
aboutUsRoute.put(
  "/aboutus",

  createOrUpdateAboutUsController
);
aboutUsRoute.put("/aboutus/stat/:id", updateAboutUsStatController);
aboutUsRoute.delete("/aboutus/stat/:id", deleteAboutUsStatController);

export default aboutUsRoute;
