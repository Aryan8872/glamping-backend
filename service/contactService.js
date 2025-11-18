import prisma from "../utils/prismaClient.js";

export const upsertContactService = async (data) => {
  const contactData = await prisma.contact.upsert({
    where: { id: 1 },
    create: { id: 1, ...data },
    update: { id: 1, ...data },
  });
  return contactData;
};

export const getContactService = async () => {
  const conact = await prisma.contact.findUnique({where:{id:1}});
  return conact;
};
