import { Router } from "express";
import {
  createBookingController,
  cancelBookingController,
  getBookingController,
  updateBookingController,
  getAllBookingController
} from "./bookingController.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const bookingRoute = Router();

bookingRoute.post("/booking/new", asyncHandler(createBookingController));
bookingRoute.put(
  "/booking/update/:id",
  asyncHandler(updateBookingController)
);

bookingRoute.get("/booking/all", asyncHandler(getAllBookingController));

bookingRoute.post("/booking/:id/cancel", asyncHandler(cancelBookingController));

// bookingRoute.get("/booking/all", asyncHandler(getAllBookingController));
bookingRoute.get("/booking/:id", asyncHandler(getBookingController));
// bookingRoute.get(
//   "/booking/:userId",
//   asyncHandler(getBookingsByUserIdController)
// );

export default bookingRoute;
