import express from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as destinationController from "./destinationController.js";
import { destinationUploadMiddleware } from "../../utils/uploads/multer.destination.js";
import { multerErrorHandler } from "../../utils/uploads/multerErrors.js";

const destinationRoute = express.Router();

destinationRoute.get(
  "/destination/all",
  asyncHandler(destinationController.getAllDestinationsController)
);
destinationRoute.get(
  "/destination/:id",
  asyncHandler(destinationController.getDestinationByIdController)
);

destinationRoute.post(
  "/destination/new",
  destinationUploadMiddleware,
  multerErrorHandler,
  asyncHandler(destinationController.createDestinationController)
);

destinationRoute.put(
  "/destination/update/:id",
  destinationUploadMiddleware,
  multerErrorHandler,
  asyncHandler(destinationController.updateDestinationController)
);

destinationRoute.delete(
  "/destination/delete/:id",
  asyncHandler(destinationController.deleteDestinationController)
);

export default destinationRoute;
