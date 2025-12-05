import { Router } from "express";
import {
  createBookingController,
  updateBookingController,
  cancelBookingController,
  getBookingController,
  getAllBookingController,
} from "./bookingController.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import {
  createBookingSchema,
  updateBookingStatusSchema,
} from "./bookingValidation.js";

const bookingRoute = Router();

bookingRoute.post(
  "/booking/new",
  validateRequest(createBookingSchema),
  createBookingController
);
bookingRoute.get("/booking/all", getAllBookingController);

bookingRoute.put(
  "/booking/:id",
  validateRequest(updateBookingStatusSchema.partial()), // Allow partial updates or define a separate update schema if needed
  updateBookingController
);

bookingRoute.patch("/booking/:id/cancel", cancelBookingController);
bookingRoute.get("/booking/:id", getBookingController);

export default bookingRoute;
