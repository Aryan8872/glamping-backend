import { Router } from "express";
import {
  createFacilityController,
  getAllFacilitiesController,
  getFacilityByIdController,
  updateFacilityController,
  deleteFacilityController,
} from "./facilityController.js";

import {
  createFacilitySchema,
  updateFacilitySchema,
} from "./facilityValidation.js";

const facilityRoute = Router();

facilityRoute.post(
  "/facility/new",

  createFacilityController
);

facilityRoute.get("/facility/all", getAllFacilitiesController);
facilityRoute.get("/facility/:id", getFacilityByIdController);

facilityRoute.put(
  "/facility/:id",

  updateFacilityController
);

facilityRoute.delete("/facility/:id", deleteFacilityController);

export default facilityRoute;
