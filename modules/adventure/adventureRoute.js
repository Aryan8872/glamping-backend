import express from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as adventureController from "./adventureController.js";
import { adventureUploadMiddleware } from "../../utils/uploads/multer.adventure.js";
import { multerErrorHandler } from "../../utils/uploads/multerErrors.js";

import {
  createAdventureSchema,
  updateAdventureSchema,
} from "./adventureValidation.js";
const adventureRoute = express.Router();
adventureRoute.get(
  "/adventure/all",

  asyncHandler(adventureController.getAllAdventuresController)
);
adventureRoute.get(
  "/adventure/:id",
  asyncHandler(adventureController.getAdventureByIdController)
);
adventureRoute.get(
  "/adventure/slug/:slug",
  asyncHandler(adventureController.getAdventureBySlugController)
);

adventureRoute.post(
  "/adventure/new",
  adventureUploadMiddleware,
  multerErrorHandler,

  asyncHandler(adventureController.createAdventureController)
);
adventureRoute.put(
  "/adventure/update/:id",
  adventureUploadMiddleware,
  multerErrorHandler,

  asyncHandler(adventureController.updateAdventureController)
);

adventureRoute.delete(
  "/adventure/delete/:id",
  asyncHandler(adventureController.deleteAdventureController)
);
adventureRoute.post(
  "/adventure/assign/:campId",
  asyncHandler(adventureController.assignAdventuresToCampController)
);
export default adventureRoute;
