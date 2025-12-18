import prisma from "../../utils/prismaClient.js";
import { BlogStatus } from "../../utils/types.js";
import { safeDelete } from "../../storage/storageTransaction.js";

export const addNewBlogService = async (data) => {
  const blogdata = await prisma.blog.create({ data });
  return blogdata;
};

export const getAllBlogService = async () => {
  const data = await prisma.blog.findMany({
    select: {
      id: true,
      title: true,
      excerpt: true,
      author: true,
      slug: true,
      createdAt: true,
      updatedAt: true,
      metaTitle: true,
      metaDescription: true,
      metaKeywords: true,
      indexable: true,
      coverImage: true,
      tags: true,
    },
  });
  return data;
};

export const getBlogByIDService = async (id) => {
  const blog = await prisma.blog.findUnique({
    where: { id: id },
    select: {
      id: true,
      title: true,
      excerpt: true,
      author: true,
      slug: true,
      createdAt: true,
      updatedAt: true,
      metaTitle: true,
      metaDescription: true,
      metaKeywords: true,
      indexable: true,
      coverImage: true,
      tags: true,
    },
  });
  return blog;
};

export const updateBlogStatusService = async (blogId, status) => {
  if (BlogStatus.includes(status)) {
    const updatedStatusBlog = await prisma.blog.update({
      where: { id: blogId },
      data: { status: status },
    });
    return updatedStatusBlog;
  }
  return false;
};

export const updateBlogService = async (id, data) => {
  // Fetch existing blog to check for cover image change
  const existingBlog = await prisma.blog.findUnique({
    where: { id },
    select: { coverImage: true },
  });

  // Delete old cover image if new one is provided
  if (
    data.coverImage &&
    existingBlog?.coverImage &&
    data.coverImage !== existingBlog.coverImage
  ) {
    safeDelete(existingBlog.coverImage).catch((err) => {
      console.error(`⚠️ Failed to delete old blog cover image:`, err);
    });
  }

  return await prisma.blog.update({
    where: { id },
    data,
  });
};

export const deleteBlogService = async (id) => {
  // Fetch blog to get cover image before deletion
  const blog = await prisma.blog.findUnique({
    where: { id },
    select: { coverImage: true },
  });

  // Soft delete (update status to DELETED)
  const result = await prisma.blog.update({
    where: { id },
    data: { status: "DELETED" },
  });

  // Delete cover image from storage (non-blocking)
  if (blog?.coverImage) {
    safeDelete(blog.coverImage).catch((err) => {
      console.error(`⚠️ Failed to delete cover image for blog ${id}:`, err);
    });
  }

  return result;
};
