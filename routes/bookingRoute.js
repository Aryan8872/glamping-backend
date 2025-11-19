import { Router } from "express";
import {
  createBookingController,
  getAllBookingController,
  getBookingByIdController,
  getBookingsByUserIdController,
  updateBookingStatusController,
} from "../controllers/bookingController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const bookingRoute = Router();

bookingRoute.post("/booking/new", asyncHandler(createBookingController));
bookingRoute.patch(
  "/booking/update/:bookingId/:bookingStatus",
  asyncHandler(updateBookingStatusController)
);
bookingRoute.get("/booking/all", asyncHandler(getAllBookingController));
bookingRoute.get("/booking/:bookingId", asyncHandler(getBookingByIdController));
bookingRoute.get(
  "/booking/:userId",
  asyncHandler(getBookingsByUserIdController)
);

export default bookingRoute;
