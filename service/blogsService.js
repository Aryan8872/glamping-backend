import prisma from "../utils/prismaClient.js";
import { BlogStatus } from "../utils/types.js";
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
