import { Router } from "express";
import {
  createFacilityController,
  getAllFacilitiesController,
  getFacilityByIdController,
  updateFacilityController,
  deleteFacilityController,
} from "./facilityController.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import {
  createFacilitySchema,
  updateFacilitySchema,
} from "./facilityValidation.js";

const facilityRoute = Router();

facilityRoute.post(
  "/facility/new",
  validateRequest(createFacilitySchema),
  createFacilityController
);

facilityRoute.get("/facility/all", getAllFacilitiesController);
facilityRoute.get("/facility/:id", getFacilityByIdController);

facilityRoute.put(
  "/facility/:id",
  validateRequest(updateFacilitySchema),
  updateFacilityController
);

facilityRoute.delete("/facility/:id", deleteFacilityController);

export default facilityRoute;
