import prisma from "../utils/prismaClient.js";
import { GalleryStatus } from "../utils/types.js";

export const createGalleryService = async (data) => {
  console.log(data);
  const galleryData = await prisma.gallery.create({ data });
  return galleryData;
};

export const updateGalleryService = async (id, data) => {
  const updatedGallery = await prisma.gallery.update({ where: { id }, data });
  return updatedGallery;
};
export const getGalleryService = async () => {
  const gallery = await prisma.gallery.findMany({
    select: {
      id: true,
      title: true,
      coverImage: true,
      excerpt: true,
      description: true,
      slug: true,
      images: true,
      imageAlt: true,
      metaDescription: true,
      metaKeywords: true,
      metaTitle: true,
    },
  });
  console.log(gallery);
  return gallery;
};

export const getGalleryBySlugService = async (slug) => {
  const gallery = await prisma.gallery.findUnique({ where: { slug: slug } });
  return gallery;
};
export const updateGalleryStatusService = async (galleryId, status) => {
  if (GalleryStatus.includes(status)) {
    const updatedStatusGallery = await prisma.gallery.update({
      where: { id: galleryId },
      data: { status: status },
    });
    return updatedStatusGallery;
  }
  return false;
};
