import { Router } from "express";
import { createFacility, deleteFacility, getAllFacilities, getFacilityById, updateFacility } from "./facilityController.js";


const facilityRoute = Router();

facilityRoute.post("/facility/new", createFacility);
facilityRoute.get("/facility/all", getAllFacilities);
facilityRoute.get("/facility/:id", getFacilityById);
facilityRoute.put("/facility/:id", updateFacility);
facilityRoute.delete("/facility:id", deleteFacility);

export default facilityRoute;
