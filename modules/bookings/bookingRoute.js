import { Router } from "express";
import {
  createBookingController,
  updateBookingController,
  cancelBookingController,
  getBookingController,
  getAllBookingController,
  getCampAvailabilityController,
} from "./bookingController.js";

import {
  createBookingSchema,
  updateBookingStatusSchema,
} from "./bookingValidation.js";

const bookingRoute = Router();

bookingRoute.post(
  "/booking/new",

  createBookingController,
);
bookingRoute.get("/booking/all", getAllBookingController);

bookingRoute.put(
  "/booking/:id",

  updateBookingController,
);

bookingRoute.patch("/booking/:id/cancel", cancelBookingController);
bookingRoute.get(
  "/booking/availability/:campId",
  getCampAvailabilityController,
);
bookingRoute.get("/booking/:id", getBookingController);

export default bookingRoute;
