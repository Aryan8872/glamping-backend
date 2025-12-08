import prisma from "../../utils/prismaClient.js";
import { NotFoundError, ConflictError } from "../../utils/error.js";

export const getAllDestinations = async (includeInactive = false) => {
  const where = includeInactive ? {} : { isActive: true };

  return await prisma.destination.findMany({
    where,
    orderBy: { isFeatured: "desc" }, // Featured first
    include: {
      _count: {
        select: { campSites: true },
      },
    },
  });
};

export const getDestinationById = async (id) => {
  const destination = await prisma.destination.findUnique({
    where: { id: Number(id) },
    include: {
      campSites: true,
    },
  });
  if (!destination) {
    throw new NotFoundError("Destination not found");
  }
  return destination;
};

export const createDestination = async (data) => {
  const existing = await prisma.destination.findUnique({
    where: { slug: data.slug },
  });
  if (existing) {
    throw new ConflictError("Destination with this slug already exists");
  }
  return await prisma.destination.create({
    data,
  });
};

export const updateDestination = async (id, data) => {
  const destination = await prisma.destination.findUnique({
    where: { id: Number(id) },
  });
  if (!destination) {
    throw new NotFoundError("Destination not found");
  }
  if (data.slug && data.slug !== destination.slug) {
    const existing = await prisma.destination.findUnique({
      where: { slug: data.slug },
    });
    if (existing) {
      throw new ConflictError("Destination with this slug already exists");
    }
  }
  return await prisma.destination.update({
    where: { id: Number(id) },
    data,
  });
};

export const deleteDestination = async (id) => {
  const destination = await prisma.destination.findUnique({
    where: { id: Number(id) },
  });
  if (!destination) {
    throw new NotFoundError("Destination not found");
  }
  return await prisma.destination.delete({
    where: { id: Number(id) },
  });
};
