import { Router } from "express";
import {
  createBookingController,
  cancelBookingController,
  getBookingController,
  updateBookingController,
} from "./bookingController.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const bookingRoute = Router();

bookingRoute.post("/booking/new", asyncHandler(createBookingController));
bookingRoute.patch(
  "/booking/update/:bookingId/:bookingStatus",
  asyncHandler(updateBookingController)
);
bookingRoute.post("/booking/:id/cancel", asyncHandler(cancelBookingController));

// bookingRoute.get("/booking/all", asyncHandler(getAllBookingController));
bookingRoute.get("/booking/:bookingId", asyncHandler(getBookingController));
// bookingRoute.get(
//   "/booking/:userId",
//   asyncHandler(getBookingsByUserIdController)
// );

export default bookingRoute;
