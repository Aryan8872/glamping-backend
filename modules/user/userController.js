import {
  createUserService,
  getAllUserService,
  updateUserService,
  getUserByIdService,
  getCampHostUsers,
  getFeaturedHosts,
} from "./userService.js";
import { processSingleFile } from "../../utils/uploads/uploadAdapter.js";

export const createUserController = async (req, res) => {
  const profilePicture = await processSingleFile(req.file, "user");

  const payload = {
    ...req.body,
    ...(profilePicture && { profilePicture }),
    isFeatured: req.body.isFeatured === "true" || req.body.isFeatured === true,
    yearsOfExperience: req.body.yearsOfExperience
      ? Number(req.body.yearsOfExperience)
      : 0,
  };

  const newuser = await createUserService(payload);
  return res
    .status(201)
    .json({ message: "successfully created user", data: newuser });
};

export const updateUserController = async (req, res) => {
  const userId = parseInt(req.params.userId);
  const profilePicture = await processSingleFile(req.file, "user");

  // Clean up undefined values from body if any, or handle in service
  const payload = {
    ...req.body,
    ...(profilePicture && { profilePicture }),
  };

  if (payload.isFeatured !== undefined) {
    payload.isFeatured =
      payload.isFeatured === "true" || payload.isFeatured === true;
  }
  if (payload.yearsOfExperience !== undefined) {
    payload.yearsOfExperience = Number(payload.yearsOfExperience);
  }

  const newuser = await updateUserService(userId, payload);
  return res
    .status(201)
    .json({ message: "successfully updated user", data: newuser });
};

export const getAllUserController = async (req, res) => {
  const allUsers = await getAllUserService();
  return res
    .status(200)
    .json({ message: "successfully retrieved all users", data: allUsers });
};

export const getUserByIdController = async (req, res) => {
  const userId = parseInt(req.params.userId);
  const user = await getUserByIdService(userId);
  return res
    .status(200)
    .json({ message: "successfully retrieved user by id", data: user });
};

export const getCampHostUsersController = async (req, res) => {
  const hosts = await getCampHostUsers();
  return res
    .status(200)
    .json({ message: "successfully retrieved camphosts", data: hosts });
};

export const getFeaturedHostsController = async (req, res) => {
  const hosts = await getFeaturedHosts();
  return res.status(200).json({ data: hosts });
};
