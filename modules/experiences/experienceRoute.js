import express from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as experienceController from "./experienceController.js";
import { experienceUploadMiddleware } from "../../utils/uploads/multer.experience.js";
import { multerErrorHandler } from "../../utils/uploads/multerErrors.js";

const experienceRoute = express.Router();

experienceRoute.get(
  "/experience/all",
  asyncHandler(experienceController.getAllExperiencesController)
);
experienceRoute.get(
  "/experience/:id",
  asyncHandler(experienceController.getExperienceByIdController)
);

experienceRoute.post(
  "/experience/new",
  experienceUploadMiddleware,
  multerErrorHandler,
  asyncHandler(experienceController.createExperienceController)
);

experienceRoute.put(
  "/experience/update/:id",
  experienceUploadMiddleware,
  multerErrorHandler,
  asyncHandler(experienceController.updateExperienceController)
);

experienceRoute.delete(
  "/experience/delete/:id",
  asyncHandler(experienceController.deleteExperienceController)
);

export default experienceRoute;
