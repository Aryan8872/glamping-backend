import prisma from "../../utils/prismaClient.js";
import { NotFoundError, ConflictError } from "../../utils/error.js";

export const getAllExperiences = async (includeInactive = false) => {
  const where = includeInactive ? {} : { isActive: true };

  return await prisma.experience.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { campSites: true },
      },
    },
  });
};

export const getExperienceById = async (id) => {
  const experience = await prisma.experience.findUnique({
    where: { id: Number(id) },
    include: {
      campSites: {
        include: {
          campSite: true,
        },
      },
    },
  });
  if (!experience) {
    throw new NotFoundError("Experience not found");
  }
  return experience;
};

export const getExperienceBySlug = async (slug) => {
  const experience = await prisma.experience.findUnique({
    where: { slug },
    include: {
      campSites: {
        include: {
          campSite: true,
        },
      },
    },
  });
  if (!experience) {
    throw new NotFoundError("Experience not found");
  }
  return experience;
};

export const createExperience = async (data) => {
  const existing = await prisma.experience.findUnique({
    where: { slug: data.slug },
  });
  if (existing) {
    throw new ConflictError("Experience with this slug already exists");
  }
  return await prisma.experience.create({
    data,
  });
};

export const updateExperience = async (id, data) => {
  const experience = await prisma.experience.findUnique({
    where: { id: Number(id) },
  });
  if (!experience) {
    throw new NotFoundError("Experience not found");
  }
  if (data.slug && data.slug !== experience.slug) {
    const existing = await prisma.experience.findUnique({
      where: { slug: data.slug },
    });
    if (existing) {
      throw new ConflictError("Experience with this slug already exists");
    }
  }
  return await prisma.experience.update({
    where: { id: Number(id) },
    data,
  });
};

export const deleteExperience = async (id) => {
  const experience = await prisma.experience.findUnique({
    where: { id: Number(id) },
  });
  if (!experience) {
    throw new NotFoundError("Experience not found");
  }
  return await prisma.experience.delete({
    where: { id: Number(id) },
  });
};
