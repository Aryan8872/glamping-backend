import prisma from "../utils/prismaClient.js";

export const upsertAboutUsService = async (data) => {
  const res = await prisma.aboutUs.upsert({
    where: { id: 1 },
    create: { id: 1, ...data },
    update: { ...data },
  });
  return res;
};

export const getAboutUsService = async () => {
  const res = await prisma.aboutUs.findUnique({
    where: { id: 1 },
    include: { stats: true, coreValues: true },
  });
  return res;
};
