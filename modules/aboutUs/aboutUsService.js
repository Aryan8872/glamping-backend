import prisma from "../../utils/prismaClient.js";

export const getAboutUsService = async () => {
  const aboutUs = await prisma.aboutUs.findUnique({
    where: { id: 1 },
    include: { coreValues: true, stats: true },
  });
  return aboutUs;
};
export const updateAboutUsStat = async (id, data) => {
  const stat = await prisma.stat.update({
    where: { id: id },
    data: { ...data },
  });
  return stat
};


export const deleteAboutUsStat
 = async (id) => {
  const stat = await prisma.stat.delete({
    where: { id: id },
  });
  return stat
};
export const createOrUpdateAboutUsService = async (data) => {
  // Since AboutUs has only one row with id = 1, we use upsert
  const aboutUs = await prisma.aboutUs.upsert({
    where: { id: 1 },
    update: {
      aboutUs: data.aboutUs,
      textbox_1: data.textbox_1,
      textbox_2: data.textbox_2,
      mission: data.mission,
      vision: data.vision,
      updatedAt: new Date(),

      // Nested update for Stats
      stats: {
        deleteMany: {}, // Delete old stats
        create: data.stats.map((s) => ({
          value: s.value,
          icon: s.icon,
          heading: s.heading,
        })),
      },

      // Nested update for CoreValues
      coreValues: {
        deleteMany: {}, // Delete old core values
        create: data.coreValues.map((c) => ({
          title: c.title,
          description: c.description,
          icon: c.icon,
        })),
      },
    },
    create: {
      id: 1,
      aboutUs: data.aboutUs,
      textbox_1: data.textbox_1,
      textbox_2: data.textbox_2,
      mission: data.mission,
      vision: data.vision,

      stats: {
        create: data.stats.map((s) => ({
          value: s.value,
          icon: s.icon,
          heading: s.heading,
        })),
      },

      coreValues: {
        create: data.coreValues.map((c) => ({
          title: c.title,
          description: c.description,
          icon: c.icon,
        })),
      },
    },
    include: { coreValues: true, stats: true },
  });

  return aboutUs;
};
