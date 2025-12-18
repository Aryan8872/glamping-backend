import prisma from "../../utils/prismaClient.js";
import { GalleryStatus } from "../../utils/types.js";
import { removeFile } from "../../utils/uploads/storage.utils.js";
import { safeDelete } from "../../storage/storageTransaction.js";

/**
 * Create a gallery record
 */
export const createGalleryService = async (data) => {
  if (!data.slug && data.title) {
    const slugBase = data.title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-]/g, "");
    data.slug = `${slugBase}-${Date.now().toString().slice(-5)}`;
  }

  const galleryData = await prisma.gallery.create({
    data: {
      title: data.title,
      description: data.description || "",
      excerpt: data.excerpt || "",
      images: data.images || [],
      coverImage: data.coverImage || "",
      slug: data.slug,
      metaTitle: data.metaTitle || null,
      metaDescription: data.metaDescription || null,
      metaKeywords: data.metaKeywords || null,
      imageAlt: data.imageAlt || null,
    },
  });

  return galleryData;
};

/**
 * Update gallery by slug
 */
export const updateGalleryService = async (slug, updateData) => {
  const exists = await prisma.gallery.findUnique({ where: { slug } });
  if (!exists) throw new Error("Gallery not found");

  // Remove images marked for deletion
  if (updateData.removedImages && Array.isArray(updateData.removedImages)) {
    await safeDelete(updateData.removedImages);
  }

  // Merge existing images with newly uploaded ones
  let finalImages = exists.images || [];
  if (Array.isArray(updateData.images)) finalImages = updateData.images;

  if (Array.isArray(updateData.newImages) && updateData.newImages.length) {
    finalImages = [...finalImages, ...updateData.newImages];
  }

  // Handle cover image replacement
  let finalCoverImage = exists.coverImage;
  if (updateData.coverImage) {
    if (exists.coverImage) await safeDelete(exists.coverImage);
    finalCoverImage = updateData.coverImage;
  }

  const updated = await prisma.gallery.update({
    where: { slug },
    data: {
      title: updateData.title ?? exists.title,
      description: updateData.description ?? exists.description,
      excerpt: updateData.excerpt ?? exists.excerpt,
      images: finalImages,
      galleryStatus: updateData.galleryStatus ?? exists.galleryStatus,
      coverImage: finalCoverImage,
      metaTitle: updateData.metaTitle ?? exists.metaTitle,
      metaDescription: updateData.metaDescription ?? exists.metaDescription,
      metaKeywords: updateData.metaKeywords ?? exists.metaKeywords,
      imageAlt: updateData.imageAlt ?? exists.imageAlt,
    },
  });

  return updated;
};

/**
 * Get all galleries
 */
export const getGalleryService = async () => {
  return await prisma.gallery.findMany({
    where: {
      galleryStatus: {
        in: ["PUBLISHED", "DRAFT"],
      },
    },
    select: {
      id: true,
      title: true,
      coverImage: true,
      excerpt: true,
      description: true,
      slug: true,
      images: true,
      imageAlt: true,
      galleryStatus: true,
      metaDescription: true,
      metaKeywords: true,
      metaTitle: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
};

/**
 * Get gallery by slug
 */
export const getGalleryBySlugService = async (slug) => {
  return await prisma.gallery.findUnique({ where: { slug } });
};

/**
 * Update gallery status
 */
export const updateGalleryStatusService = async (slug, status) => {
  if (!GalleryStatus.includes(status)) return false;
  return await prisma.gallery.update({
    where: { slug },
    data: { galleryStatus: status },
  });
};

export const deleteGalleryService = async (id) => {
  // Fetch gallery to get image URLs before deletion
  const gallery = await prisma.gallery.findUnique({
    where: { id },
    select: { images: true, coverImage: true },
  });

  // Soft delete in database
  const result = await prisma.gallery.update({
    where: { id },
    data: { galleryStatus: "DELETED" },
  });

  // Delete associated images from storage (non-blocking)
  const imagesToDelete = [];
  if (gallery?.images?.length) imagesToDelete.push(...gallery.images);
  if (gallery?.coverImage) imagesToDelete.push(gallery.coverImage);

  if (imagesToDelete.length) {
    safeDelete(imagesToDelete).catch((err) => {
      console.error(`⚠️ Failed to delete images for gallery ${id}:`, err);
    });
  }

  return result;
};
