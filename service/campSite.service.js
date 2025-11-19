import prisma from "../utils/prismaClient.js";

class CampSiteService {
  async createCampSite(data) {
    return await prisma.campSite.create({
      data,
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
    return await prisma.campSite.update({
      where: { id },
      data,
    });
  }

  async deleteCampSite(id) {
    return await prisma.campSite.delete({
      where: { id },
    });
  }
}

export const campSiteService = new CampSiteService();
