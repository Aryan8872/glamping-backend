import { Router } from "express";
import {
  createUserController,
  getAllUserController,
  getCampHostUsersController,
  getFeaturedHostsController,
  getUserByIdController,
  updateUserController,
} from "./userController.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

import { createUserSchema, updateUserSchema } from "./userValidation.js";
import { userUploadMiddleware } from "../../utils/uploads/multer.user.js";

const userroute = Router();

userroute.get("/user/camphosts", asyncHandler(getCampHostUsersController));
userroute.get("/user/featured-hosts", asyncHandler(getFeaturedHostsController));
userroute.get("/user/all", asyncHandler(getAllUserController));
userroute.get("/user/:userId", asyncHandler(getUserByIdController));
userroute.post(
  "/user/new",
  userUploadMiddleware,
  asyncHandler(createUserController),
);
userroute.patch(
  "/user/:userId",
  userUploadMiddleware,
  asyncHandler(updateUserController),
);
export default userroute;
