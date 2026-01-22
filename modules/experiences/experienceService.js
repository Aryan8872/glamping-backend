import prisma from "../../utils/prismaClient.js";
import { NotFoundError, ConflictError } from "../../utils/error.js";
import { safeDelete } from "../../storage/storageTransaction.js";

export const searchExperiences = async ({
  q,
  page = 1,
  perPage = 10,
  isActive,
}) => {
  const take = Math.max(1, Number(perPage) || 10);
  const skip = (Math.max(1, Number(page)) - 1) * take;

  const where = {};
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }
  if (isActive !== undefined) {
    where.isActive = isActive === "true" || isActive === true;
  }

  const [total, results] = await Promise.all([
    prisma.experience.count({ where }),
    prisma.experience.findMany({
      where,
      take,
      skip,
      include: {
        _count: { select: { campSites: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    total,
    results,
    page: Number(page),
    limit: take,
    totalPages: Math.ceil(total / take),
    hasMore: skip + take < total,
  };
};

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
  // Delete old image if new one is provided
  if (
    data.imageUrl &&
    experience.imageUrl &&
    data.imageUrl !== experience.imageUrl
  ) {
    safeDelete(experience.imageUrl).catch((err) => {
      console.error(`⚠️ Failed to delete old experience image:`, err);
    });
  }

  return await prisma.experience.update({
    where: { id: Number(id) },
    data,
  });
};

export const deleteExperience = async (id) => {
  const experience = await prisma.experience.findUnique({
    where: { id: Number(id) },
    select: { imageUrl: true },
  });
  if (!experience) {
    throw new NotFoundError("Experience not found");
  }

  // Delete from database
  const result = await prisma.experience.delete({
    where: { id: Number(id) },
  });

  // Delete associated image from storage (non-blocking)
  if (experience.imageUrl) {
    safeDelete(experience.imageUrl).catch((err) => {
      console.error(`⚠️ Failed to delete image for experience ${id}:`, err);
    });
  }

  return result;
};
