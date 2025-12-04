import prisma from "../../utils/prismaClient.js";

export const createFacility = async (data) => {
  if (!data.slug && data.name) {
    const slugBase = data.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-]/g, "");
    data.slug = `${slugBase}-${Date.now().toString().slice(-5)}`;
  }
  return await prisma.facility.create({
    data: {
      name: data.name,
      icon: data.icon ?? "", // optional
      slug: data.slug,
      description: data.description,
    },
  });
};

export const getAllFacilities = async () => {
  return prisma.facility.findMany({
    include: {
      campSites: true, // shows which campsites use it
    },
  });
};

export const getFacilityById = async (id) => {
  return prisma.facility.findUnique({
    where: { id },
    include: {
      campSites: true, // shows which campsites use it
    },
  });
};

export const updateFacility = async (id, data) => {
  return prisma.facility.update({
    where: { id },
    data: {
      name: data.name,
      icon: data.icon,
      description: data.description,
    },
  });
};

export const deleteFacility = async (id) => {
  await prisma.campSiteFacility.deleteMany({
    where: { facilityId: id },
  });

  return prisma.facility.delete({
    where: { id },
  });
};
