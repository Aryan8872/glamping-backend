import prisma from "../../utils/prismaClient.js";
import { removeFile } from "../../utils/uploads/storage.utils.js";

class CampSiteService {
  // CREATE CAMPSITE
  async createCampSite(data) {
    const slugBase = data.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-]/g, "");

    const slug = `${slugBase}-${Date.now().toString().slice(-5)}`;

    // Handle Facilities
    const facilitiesToConnect = [];
    const facilitiesToCreate = [];

    if (Array.isArray(data.facilities)) {
      data.facilities.forEach((f) => {
        if (f.id) {
          facilitiesToConnect.push({ id: f.id });
        } else if (f.name && f.icon && f.slug) {
          facilitiesToCreate.push({
            name: f.name,
            icon: f.icon,
            slug: f.slug,
          });
        }
      });
    }

    // Validate hostId
    let connectHost = undefined;
    if (data.hostId) {
      const user = await prisma.user.findUnique({ where: { id: data.hostId } });

      if (!user) throw new Error("Host user not found");
      if (user.userType !== "CAMPHOST")
        throw new Error("Assigned user is not a CampHost");

      connectHost = { connect: { id: user.id } };
    }

    return await prisma.campSite.create({
      data: {
        name: data.name,
        description: data.description,
        pricePerNight: data.pricePerNight,
        slug,
        images: data.images || [],

        ...(connectHost && { campHost: connectHost }),

        campSiteFacilities: {
          create: [
            ...facilitiesToConnect.map((f) => ({
              facility: { connect: f },
            })),
            ...facilitiesToCreate.map((f) => ({
              facility: { create: f },
            })),
          ],
        },
      },
      include: {
        campSiteFacilities: { include: { facility: true } },
        campHost: true,
      },
    });
  }

  // GET ALL CAMPS
  async getAllCampSites() {
    return await prisma.campSite.findMany({
      include: {
        campSiteFacilities: { include: { facility: true } },
        campHost: true,
      },
    });
  }

  // GET SINGLE CAMP
  async getCampSiteById(id) {
    return await prisma.campSite.findUnique({
      where: { id },
      include: {
        campSiteFacilities: { include: { facility: true } },
        campHost: true,
      },
    });
  }

  // UPDATE CAMPSITE (with host assignment + removal)
  async updateCampSite(id, data) {
    const campsite = await prisma.campSite.findUnique({ where: { id } });
    if (!campsite) throw new Error("Campsite not found");

    if (data.removedImages?.length) {
      data.removedImages.forEach((img) => removeFile(img));
    }
    console.log("new camp facilities", data);
    let finalImages = campsite.images;
    if (Array.isArray(data.images)) finalImages = data.images;
    if (Array.isArray(data.newImages) && data.newImages.length) {
      finalImages = [...finalImages, ...data.newImages];
    }

    const facilitiesToConnect = [];
    const facilitiesToCreate = [];

    if (Array.isArray(data.facilities)) {
      data.facilities.forEach((f) => {
        if (f.id) facilitiesToConnect.push({ id: f.id });
      });
    }

    if(Array.isArray(data.newFacilities)){
      data.newFacilities.forEach((f)=>{
        const slug = `${f.name} + ${Date.now()}`
        facilitiesToCreate.push({
          name:f.name,
          icon:f.icon,
          slug:slug
        })
      })
    }

    // 🔥 Handle Host Assignment / Removal
    let hostOperation = undefined;

    if (data.hostId) {
      const user = await prisma.user.findUnique({ where: { id: data.hostId } });

      if (!user) throw new Error("Host user not found");
      if (user.userType !== "CAMPHOST")
        throw new Error("Assigned user is not a CampHost");

      hostOperation = { connect: { id: user.id } };
    } else {
      // Unassign host if hostId = null
      hostOperation = { disconnect: true };
    }

    return await prisma.campSite.update({
      where: { id },
      data: {
        name: data.name ?? campsite.name,
        description: data.description ?? campsite.description,
        pricePerNight: data.pricePerNight ?? campsite.pricePerNight,
        images: finalImages,
        campHost: hostOperation,

        campSiteFacilities: {
          deleteMany: { campId: id },
          create: [
            ...facilitiesToConnect.map((f) => ({
              facility: { connect: f },
            })),
            ...facilitiesToCreate.map((f) => ({
              facility: { create: f },
            })),
          ],
        },
      },
      include: {
        campSiteFacilities: { include: { facility: true } },
        campHost: true,
      },
    });
  }

  // DELETE CAMP
  async deleteCampSite(id) {
    return prisma.campSite.delete({ where: { id } });
  }
}

export const campSiteService = new CampSiteService();
