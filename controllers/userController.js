import {
  createUserService,
  getAllUserService,
  updateUserService,
  getUserByIdService,
} from "../service/userService.js";

export const createUserController = async (req, res) => {
  const newuser = await createUserService(req.body);
  return res
    .status(201)
    .json({ message: "successfully created user", data: newuser });
};

export const updateUserController = async (req, res) => {
  const userId = parseInt(req.params.userId);
  const newuser = await updateUserService(userId, req.body);
  return res
    .status(201)
    .json({ message: "successfully created user", data: newuser });
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
