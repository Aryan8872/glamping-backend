import prisma from "../../utils/prismaClient.js";
import { safeDelete } from "../../storage/storageTransaction.js";

export const createUserService = (data) => {
  return prisma.user.create({ data });
};

export const updateUserService = async (id, data) => {
  // Fetch existing user to check for profile picture change
  const existingUser = await prisma.user.findUnique({
    where: { id },
    select: { profilePicture: true },
  });

  // Delete old profile picture if new one is provided
  if (
    data.profilePicture &&
    existingUser?.profilePicture &&
    data.profilePicture !== existingUser.profilePicture
  ) {
    safeDelete(existingUser.profilePicture).catch((err) => {
      console.error(
        `⚠️ Failed to delete old profile picture for user ${id}:`,
        err
      );
    });
  }

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
export const getCampHostUsers = async () => {
  const campHosts = await prisma.user.findMany({
    where: { userType: "CAMPHOST" },
    include: { campSite: true },
  });
  return campHosts;
};

export const getFeaturedHosts = async () => {
  return await prisma.user.findMany({
    where: {
      userType: "CAMPHOST",
      isFeatured: true,
    },
    include: { campSite: true },
    orderBy: { fullName: "asc" },
  });
};
