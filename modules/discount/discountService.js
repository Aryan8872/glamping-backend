import prisma from "../../utils/prismaClient.js";

export const createDiscountService = async (data) => {
  return await prisma.discount.create({ data });
};

export const searchDiscounts = async ({
  q,
  page = 1,
  perPage = 10,
  active,
}) => {
  const take = Math.max(1, Number(perPage) || 10);
  const skip = (Math.max(1, Number(page)) - 1) * take;

  const where = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { camp: { name: { contains: q, mode: "insensitive" } } },
      { adventure: { name: { contains: q, mode: "insensitive" } } },
    ];
  }
  if (active !== undefined) {
    where.active = active === "true" || active === true;
  }

  const [total, results] = await Promise.all([
    prisma.discount.count({ where }),
    prisma.discount.findMany({
      where,
      take,
      skip,
      include: {
        camp: { select: { name: true } },
        adventure: { select: { name: true } },
      },
      orderBy: { id: "desc" },
    }),
  ]);

  return { total, results, page: Number(page), perPage: take };
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
    include: {
      camp: { select: { id: true, slug: true, name: true } },
      adventure: { select: { id: true, slug: true, name: true } },
    },
    orderBy: { startsAt: "desc" }, // Get the most recent one
  });
};
