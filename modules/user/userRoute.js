import { Router } from "express";
import {
  createUserController,
  getAllUserController,
  getCampHostUsersController,
  getUserByIdController,
  updateUserController,
} from "./userController.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
const userroute = Router();

userroute.get("/user/camphosts", asyncHandler(getCampHostUsersController));
userroute.get("/user/all", asyncHandler(getAllUserController));
userroute.get("/user/:userId", asyncHandler(getUserByIdController));
userroute.post("/user/new", asyncHandler(createUserController));
userroute.put("/user/:userId", asyncHandler(updateUserController));
export default userroute;
