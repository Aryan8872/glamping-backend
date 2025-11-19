import prisma from "../utils/prismaClient.js";

export const createUserService = (data) => {
  return prisma.user.create({ data });
};

export const updateUserService = async (id, data) => {
  const updatedUser = await prisma.user.update({ where: { id }, data });
  return updatedUser;
};
export const getAllUserService = async () => {
  const users = await prisma.user.findMany();
  return users;
};

export const getUserByIdService = async (id) => {
  const users = await prisma.user.findUnique({ where: { id } });
  return users;
};
