import prisma from "../../utils/prismaClient.js";
import { NotFoundError, ConflictError } from "../../utils/error.js";
export const getAllAdventures = async (includeInactive = false) => {
  const where = includeInactive ? {} : { isActive: true };

  return await prisma.adventure.findMany({
    where,
    include: {
      campSites: {
        include: {
          campSite: {
            select: {
              id: true,
              name: true,
              slug: true,
              images: true,
              pricePerNight: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};
export const getAdventureById = async (id) => {
  const adventure = await prisma.adventure.findUnique({
    where: { id: Number(id) },
    include: {
      campSites: {
        include: {
          campSite: {
            include: {
              campSiteFacilities: {
                include: {
                  facility: true,
                },
              },
            },
          },
        },
      },
    },
  });
  if (!adventure) {
    throw new NotFoundError("Adventure not found");
  }
  return adventure;
};
export const getAdventureBySlug = async (slug) => {
  const adventure = await prisma.adventure.findUnique({
    where: { slug },
    include: {
      campSites: {
        include: {
          campSite: {
            include: {
              campSiteFacilities: {
                include: {
                  facility: true,
                },
              },
            },
          },
        },
      },
    },
  });
  if (!adventure) {
    throw new NotFoundError("Adventure not found");
  }
  return adventure;
};
export const createAdventure = async (data) => {
  // Check if slug already exists
  const existing = await prisma.adventure.findUnique({
    where: { slug: data.slug },
  });
  if (existing) {
    throw new ConflictError("Adventure with this slug already exists");
  }
  return await prisma.adventure.create({
    data: {
      title: data.title,
      pageDescription: data.pageDescription,
      bannerImage: data.bannerImage,
      coverImage: data.coverImage,
      description: data.description,
      name: data.name,
      slug: data.slug,
      isActive: data.isActive,
    },
  });
};
export const updateAdventure = async (id, data) => {
  const adventure = await prisma.adventure.findUnique({
    where: { id: Number(id) },
  });
  console.log("adventure update data", data);
  if (!adventure) {
    throw new NotFoundError("Adventure not found");
  }
  // Check slug uniqueness if updating
  if (data.slug && data.slug !== adventure.slug) {
    const existing = await prisma.adventure.findUnique({
      where: { slug: data.slug },
    });
    if (existing) {
      throw new ConflictError("Adventure with this slug already exists");
    }
  }
  return await prisma.adventure.update({
    where: { id: Number(id) },
    data: {
      title: data.title ?? adventure.title,
      pageDescription: data.pageDescription ?? adventure.pageDescription,
      bannerImage: data.bannerImage ?? adventure.bannerImage,
      coverImage: data.coverImage ?? adventure.coverImage,
      description: data.description ?? adventure.description,
      name: data.name ?? adventure.name,
      slug: data.slug ?? adventure.slug,
      isActive: data.isActive ?? adventure.isActive,
    },
  });
};
export const deleteAdventure = async (id) => {
  const adventure = await prisma.adventure.findUnique({
    where: { id: Number(id) },
  });
  if (!adventure) {
    throw new NotFoundError("Adventure not found");
  }
  return await prisma.adventure.delete({
    where: { id: Number(id) },
  });
};
export const assignAdventuresToCamp = async (campId, adventureIds) => {
  // Verify camp exists
  const camp = await prisma.campSite.findUnique({
    where: { id: Number(campId) },
  });
  if (!camp) {
    throw new NotFoundError("Camp not found");
  }
  // Remove existing assignments
  await prisma.campSiteAdventure.deleteMany({
    where: { campId: Number(campId) },
  });
  // Create new assignments
  if (adventureIds && adventureIds.length > 0) {
    await prisma.campSiteAdventure.createMany({
      data: adventureIds.map((adventureId) => ({
        campId: Number(campId),
        adventureId: Number(adventureId),
      })),
    });
  }
  return await prisma.campSite.findUnique({
    where: { id: Number(campId) },
    include: {
      adventures: {
        include: {
          adventure: true,
        },
      },
    },
  });
};
