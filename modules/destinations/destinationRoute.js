import express from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as destinationController from "./destinationController.js";
import { destinationUploadMiddleware } from "../../utils/uploads/multer.destination.js";
import { multerErrorHandler } from "../../utils/uploads/multerErrors.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import {
  createDestinationSchema,
  updateDestinationSchema,
  searchDestinationSchema,
} from "./destinationValidation.js";

const destinationRoute = express.Router();

destinationRoute.get(
  "/destination/all",
  validateRequest(searchDestinationSchema, "query"),
  asyncHandler(destinationController.getAllDestinationsController),
);
destinationRoute.get(
  "/destination/:id",
  asyncHandler(destinationController.getDestinationByIdController),
);

destinationRoute.post(
  "/destination/new",
  destinationUploadMiddleware,
  multerErrorHandler,
  validateRequest(createDestinationSchema),
  asyncHandler(destinationController.createDestinationController),
);

destinationRoute.put(
  "/destination/update/:id",
  destinationUploadMiddleware,
  multerErrorHandler,
  validateRequest(updateDestinationSchema),
  asyncHandler(destinationController.updateDestinationController),
);

destinationRoute.delete(
  "/destination/delete/:id",
  asyncHandler(destinationController.deleteDestinationController),
);

export default destinationRoute;
