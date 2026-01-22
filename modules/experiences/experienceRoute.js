import express from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as experienceController from "./experienceController.js";
import { experienceUploadMiddleware } from "../../utils/uploads/multer.experience.js";
import { multerErrorHandler } from "../../utils/uploads/multerErrors.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import {
  createExperienceSchema,
  updateExperienceSchema,
  searchExperienceSchema,
} from "./experienceValidation.js";

const experienceRoute = express.Router();

experienceRoute.get(
  "/experience/all",
  validateRequest(searchExperienceSchema, "query"),
  asyncHandler(experienceController.getAllExperiencesController),
);
experienceRoute.get(
  "/experience/:id",
  asyncHandler(experienceController.getExperienceByIdController),
);

experienceRoute.post(
  "/experience/new",
  experienceUploadMiddleware,
  multerErrorHandler,
  validateRequest(createExperienceSchema),
  asyncHandler(experienceController.createExperienceController),
);

experienceRoute.put(
  "/experience/update/:id",
  experienceUploadMiddleware,
  multerErrorHandler,
  validateRequest(updateExperienceSchema),
  asyncHandler(experienceController.updateExperienceController),
);

experienceRoute.delete(
  "/experience/delete/:id",
  asyncHandler(experienceController.deleteExperienceController),
);

export default experienceRoute;
