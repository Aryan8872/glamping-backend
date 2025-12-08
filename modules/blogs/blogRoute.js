import { Router } from "express";
import {
  addNewBlogController,
  getAllBlogController,
  getBlogByIDController,
  updateBlogStatusController,
} from "./blogController.js";

import { createBlogSchema, updateBlogStatusSchema } from "./blogValidation.js";

const blogRoute = Router();

blogRoute.post(
  "/blog/new",

  addNewBlogController
);
blogRoute.get("/blog/all", getAllBlogController);
blogRoute.get("/blog/:blogId", getBlogByIDController);
blogRoute.patch(
  "/blog/:blogId/:status",

  updateBlogStatusController
);
// blogRoute.delete("/blog/:blogId",deleteBlogController)

export default blogRoute;
