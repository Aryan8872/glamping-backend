import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  createDiscountController,
  getAllDiscountsController,
  getDiscountByIdController,
  updateDiscountController,
  deleteDiscountController,
  getActiveDiscountsController,
  getFeaturedDiscountsController,
} from "./discountController.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import {
  createDiscountSchema,
  updateDiscountSchema,
} from "./discountValidation.js";

const discountRoute = Router();

discountRoute.post(
  "/discount/new",
  validateRequest(createDiscountSchema),
  asyncHandler(createDiscountController)
);
discountRoute.get("/discount/all", asyncHandler(getAllDiscountsController));
discountRoute.get(
  "/discount/active",
  asyncHandler(getActiveDiscountsController)
);
discountRoute.get(
  "/discount/featured",
  asyncHandler(getFeaturedDiscountsController)
);
discountRoute.get("/discount/:id", asyncHandler(getDiscountByIdController));
discountRoute.put(
  "/discount/:id",
  validateRequest(updateDiscountSchema),
  asyncHandler(updateDiscountController)
);
discountRoute.delete("/discount/:id", asyncHandler(deleteDiscountController));

export default discountRoute;
