import { Router } from "express";
import {
  createUserController,
  getAllUserController,
  getUserByIdController,
  updateUserController,
} from "../controllers/userController.js";
import { asyncHandler } from "../utils/asyncHandler.js";
const userroute = Router();

userroute.get("/user/all", asyncHandler(getAllUserController));
userroute.get("/user/:userId", asyncHandler(getUserByIdController));
userroute.post("/user/new", asyncHandler(createUserController));
userroute.patch("/user/:userId", asyncHandler(updateUserController));

export default userroute;
