import { connect } from "http2";
import prisma from "../../utils/prismaClient.js";
import { removeFile } from "../../utils/uploads/storage.utils.js";

class CampSiteService {
  async createCampSite(data) {
    const slugBase = data.title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-]/g, "");
    const slug = `${slugBase}- ${Date.now().toString().slice(-5)}`;
    return await prisma.campSite.create({
      data: {
        name: data.name,
        description: data.description,
        pricePerNight: data.pricePerNight,
        slug: slug,
        images: data.images || [],
        ...(data.hostId && {
          campHost: {
            connect: {
              id: data.hostId,
            },
          },
        }),
      },
    });
  }

  async getAllCampSites() {
    return await prisma.campSite.findMany({
      include: {
        campSiteFacilities: {
          include: { facility: true },
        },
        campHost: true,
      },
    });
  }

  async getCampSiteById(id) {
    return await prisma.campSite.findUnique({
      where: { id },
      include: {
        campSiteFacilities: { include: { facility: true } },
        campHost: true,
      },
    });
  }

  async updateCampSite(id, data) {
    const campsite = await prisma.campSite.findUnique({ where: { id: id } });
    if (!campsite) throw new Error("campsite not found");
    if (data.removedImages && Array.isArray(data.removedImages)) {
      data.removedImages.forEach((img) => {
        removeFile(img);
      });
    }
    let finalImages = campsite.images || [];
    if (data.images && Array.isArray(data.images)) finalImages = data.images;
    if (data.newImages.length && Array.isArray(data.newImages)) {
      finalImages = [...finalImages, ...data.newImages];
    }
    return await prisma.campSite.update({
      where: { id },
      data: {
        name: data.name ?? campsite.name,
        description: data.description ?? campsite.description,
        pricePerNight: data.pricePerNight ?? campsite.pricePerNight,
        slug: campsite.slug,
        ...(data.hostId && {
          campHost: {
            connect: {
              id: data.hostId,
            },
          },
        }),
        images: finalImages,
      },
    });
  }

  async deleteCampSite(id) {
    return await prisma.campSite.delete({
      where: { id },
    });
  }
}

export const campSiteService = new CampSiteService();
