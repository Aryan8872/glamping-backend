import prisma from "../../utils/prismaClient.js";

export const createDiscountService = async (data) => {
  return await prisma.discount.create({ data });
};

export const getAllDiscountsService = async () => {
  return await prisma.discount.findMany({
    include: {
      camp: { select: { name: true } },
      adventure: { select: { name: true } },
    },
  });
};

export const getDiscountByIdService = async (id) => {
  return await prisma.discount.findUnique({
    where: { id },
    include: {
      camp: { select: { name: true } },
      adventure: { select: { name: true } },
    },
  });
};

export const updateDiscountService = async (id, data) => {
  return await prisma.discount.update({
    where: { id },
    data,
  });
};

export const deleteDiscountService = async (id) => {
  return await prisma.discount.delete({
    where: { id },
  });
};

export const getActiveDiscountsService = async () => {
  const now = new Date();
  return await prisma.discount.findMany({
    where: {
      active: true,
      startsAt: { lte: now },
      OR: [{ endsAt: null }, { endsAt: { gte: now } }],
    },
    include: {
      camp: { select: { name: true } },
      adventure: { select: { name: true } },
    },
  });
};

export const getFeaturedDiscountService = async () => {
  const now = new Date();
  return await prisma.discount.findFirst({
    where: {
      isFeatured: true,
      active: true,
      startsAt: { lte: now },
      OR: [{ endsAt: null }, { endsAt: { gte: now } }],
    },
    orderBy: { startsAt: "desc" }, // Get the most recent one
  });
};
