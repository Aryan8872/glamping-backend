import prisma from "../../utils/prismaClient.js";

class FacilityService {
  async createFacility(data) {
    if (!data.slug && data.name) {
      const slugBase = data.name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9\-]/g, "");
      data.slug = `${slugBase}-${Date.now().toString().slice(-5)}`;
    }
    return await prisma.facility.create({
      data: {
        name: data.name,
        icon: data.icon ?? "", // optional
        slug:data.slug
      },
    });
  }

  async getAllFacilities() {
    return prisma.facility.findMany({
      include: {
        campSites:true // shows which campsites use it
      },
    });
  }

  async getFacilityById(id) {
    return prisma.facility.findUnique({
      where: { id },
      include: {
        campSites:true // shows which campsites use it
      },
    });
  }

  async updateFacility(id, data) {
    return prisma.facility.update({
      where: { id },
      data: {
        name: data.name,
        icon: data.icon,
      },
    });
  }

  async deleteFacility(id) {
    await prisma.campSiteFacility.deleteMany({
      where: { facilityId: id },
    });

    return prisma.facility.delete({
      where: { id },
    });
  }
}

export const facilityService = new FacilityService();
