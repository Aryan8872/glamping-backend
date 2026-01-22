import express from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as adventureController from "./adventureController.js";
import { adventureUploadMiddleware } from "../../utils/uploads/multer.adventure.js";
import { multerErrorHandler } from "../../utils/uploads/multerErrors.js";
import { validateRequest } from "../../middleware/validateRequest.js";

import {
  createAdventureSchema,
  updateAdventureSchema,
  searchAdventureSchema,
} from "./adventureValidation.js";

const adventureRoute = express.Router();

adventureRoute.get(
  "/adventure/all",
  validateRequest(searchAdventureSchema, "query"),
  asyncHandler(adventureController.getAllAdventuresController),
);
adventureRoute.get(
  "/adventure/:id",
  asyncHandler(adventureController.getAdventureByIdController),
);
adventureRoute.get(
  "/adventure/slug/:slug",
  asyncHandler(adventureController.getAdventureBySlugController),
);

adventureRoute.post(
  "/adventure/new",
  adventureUploadMiddleware,
  multerErrorHandler,
  validateRequest(createAdventureSchema),
  asyncHandler(adventureController.createAdventureController),
);
adventureRoute.put(
  "/adventure/update/:id",
  adventureUploadMiddleware,
  multerErrorHandler,
  validateRequest(updateAdventureSchema),
  asyncHandler(adventureController.updateAdventureController),
);

adventureRoute.delete(
  "/adventure/delete/:id",
  asyncHandler(adventureController.deleteAdventureController),
);
adventureRoute.post(
  "/adventure/assign/:campId",
  asyncHandler(adventureController.assignAdventuresToCampController),
);
export default adventureRoute;
