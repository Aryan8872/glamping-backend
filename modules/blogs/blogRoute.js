import { Router } from "express";
import {
  addNewBlogController,
  getAllBlogController,
  getBlogByIDController,
  updateBlogStatusController,
} from "./blogController.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { createBlogSchema, updateBlogStatusSchema } from "./blogValidation.js";

const blogRoute = Router();

blogRoute.post(
  "/blog/new",
  validateRequest(createBlogSchema),
  addNewBlogController
);
blogRoute.get("/blog/all", getAllBlogController);
blogRoute.get("/blog/:blogId", getBlogByIDController);
blogRoute.patch(
  "/blog/:blogId/:status",
  validateRequest(updateBlogStatusSchema, "params"), // Validate params if status is in params, or adjust route to use body
  updateBlogStatusController
);
// blogRoute.delete("/blog/:blogId",deleteBlogController)

export default blogRoute;
