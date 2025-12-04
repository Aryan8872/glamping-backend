import * as facilityService from "./facilityService.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const createFacilityController = asyncHandler(async (req, res) => {
  const body = req.validated || req.body || {};

  const newFacility = await facilityService.createFacility(body);

  res.status(201).json({
    message: "Facility created successfully",
    data: newFacility,
  });
});

export const getAllFacilitiesController = asyncHandler(async (req, res) => {
  const facilities = await facilityService.getAllFacilities();
  res.json({ message: "Facilities fetched", data: facilities });
});

export const getFacilityByIdController = asyncHandler(async (req, res) => {
  const facility = await facilityService.getFacilityById(Number(req.params.id));

  if (!facility) {
    return res.status(404).json({ message: "Facility not found" });
  }

  res.json({ message: "Facility found", data: facility });
});

export const updateFacilityController = asyncHandler(async (req, res) => {
  const body = req.validated || req.body || {};

  const updated = await facilityService.updateFacility(
    Number(req.params.id),
    body
  );

  res.json({
    message: "Facility updated successfully",
    data: updated,
  });
});

export const deleteFacilityController = asyncHandler(async (req, res) => {
  await facilityService.deleteFacility(Number(req.params.id));

  res.json({ message: "Facility deleted successfully" });
});
