import prisma from "../../utils/prismaClient.js";
import { NotFoundError } from "../../utils/error.js";
export const getContact = async () => {
  let contact = await prisma.contact.findUnique({
    where: { id: 1 },
  });
  // Create default if doesn't exist
  if (!contact) {
    contact = await prisma.contact.create({
      data: {
        id: 1,
        email: "info@example.com",
        phoneNumber: "+1234567890",
        address: "123 Main St, City, Country",
        facebookUrl: "https://facebook.com",
        instagramUrl: "https://instagram.com",
        twitterUrl: "https://twitter.com",
      },
    });
  }
  return contact;
};
export const updateContact = async (data) => {
  // Ensure contact exists
  await getContact();
  return await prisma.contact.update({
    where: { id: 1 },
    data,
  });
};
