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

bookingRoute.put(
  "/booking/:id",
  validateRequest(updateBookingStatusSchema.partial()), // Allow partial updates or define a separate update schema if needed
  updateBookingController
);

bookingRoute.patch("/booking/:id/cancel", cancelBookingController);
bookingRoute.get("/booking/:id", getBookingController);
bookingRoute.get("/booking/all", getAllBookingController);

export default bookingRoute;
