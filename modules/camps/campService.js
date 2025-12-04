import prisma from "../../utils/prismaClient.js";
import { removeFile } from "../../utils/uploads/storage.utils.js";

// CREATE CAMPSITE
export const createCampSite = async (data) => {
  const slugBase = data.name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "");

  const slug = `${slugBase}-${Date.now().toString().slice(-5)}`;
  let adventureIds = data.adventureIds;
  if (adventureIds && !Array.isArray(adventureIds)) {
    adventureIds = [adventureIds];
  }
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
      location: data.location ?? null,
      latitude: parseInt(data.latitude) ?? null,
      longitude: parseInt(data.longitude) ?? null,

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
      adventures: {
        create: (adventureIds || []).map((id) => ({
          adventure: { connect: { id: Number(id) } },
        })),
      },
    },
    include: {
      campSiteFacilities: { include: { facility: true } },
      campHost: true,
      adventures: { include: { adventure: true } },
    },
  });
};

// GET ALL CAMPS
export const getAllCampSites = async () => {
  return await prisma.campSite.findMany({
    include: {
      campSiteFacilities: {
        include: {
          facility: {
            select: {
              id: true,
              name: true,
              icon: true,
            },
          },
        },
      },
      campHost: {
        select: {
          id: true,
          fullName: true,
          profilePicture: true,
          email: true,
          phoneNumber: true,
          userStatus: true,
        },
      },
      adventures: { include: { adventure: true } },
    },
  });
};

export const getCampSiteById = async (id) => {
  // Convert to Number and check validity
  const campId = Number(id);
  if (!Number.isFinite(campId)) return null;

  return await prisma.campSite.findUnique({
    where: { id: campId },
    include: {
      campSiteFacilities: { include: { facility: true } },
      campHost: true,
      adventures: { include: { adventure: true } },
    },
  });
};

// UPDATE CAMPSITE (with host assignment + removal)
export const updateCampSite = async (id, data) => {
  const campsite = await prisma.campSite.findUnique({ where: { id } });
  if (!campsite) throw new Error("Campsite not found");
  console.log("updatte data", data);
  let adventureIds = [];
  if (data.adventureIds) {
    if (Array.isArray(data.adventureIds)) {
      adventureIds = data.adventureIds
        .map(Number)
        .filter((n) => Number.isFinite(n));
    } else {
      try {
        const parsed = JSON.parse(data.adventureIds);
        adventureIds = parsed.map(Number).filter((n) => Number.isFinite(n));
      } catch {
        adventureIds = [];
      }
    }
  }

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

  if (Array.isArray(data.newFacilities)) {
    data.newFacilities.forEach((f) => {
      const slug = `${f.name} + ${Date.now()}`;
      facilitiesToCreate.push({
        name: f.name,
        icon: f.icon,
        slug: slug,
      });
    });
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
      location: data.location !== undefined ? data.location : campsite.location,
      latitude:
        data.latitude !== undefined
          ? parseInt(data.latitude)
          : campsite.latitude,
      longitude:
        data.longitude !== undefined
          ? parseInt(data.longitude)
          : campsite.longitude,

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

      adventures: {
        deleteMany: { campId: id },
        create: adventureIds.map((id) => ({
          adventure: { connect: { id } },
        })),
      },
    },
    include: {
      campSiteFacilities: { include: { facility: true } },
      campHost: true,
      adventures: { include: { adventure: true } },
    },
  });
};

// DELETE CAMP
export const deleteCampSite = async (id) => {
  return prisma.campSite.delete({ where: { id } });
};

export const searchCamp = async ({
  q,
  page = 1,
  perPage = 12,
  children = 0,
  adults = 1,
  pets = 0,
  minPrice,
  maxPrice,
  facilityIds = [],
  checkIn,
  checkOut,
  sort = "relevance",
} = {}) => {
  const take = Number(perPage) || 12;
  const skip = (Number(page) - 1) * take;

  const adultsN = Math.max(0, Number(adults));
  const childrenN = Math.max(0, Number(children));
  const petsN = Math.max(0, Number(pets));

  // 1️⃣ Find conflicting bookings
  let conflictIds = [];
  if (checkIn && checkOut) {
    const chkIn = new Date(checkIn);
    const chkOut = new Date(checkOut);

    if (isNaN(chkIn.getTime()) || isNaN(chkOut.getTime())) {
      throw new Error("Invalid checkIn/checkOut dates");
    }

    const booked = await prisma.campBookings.findMany({
      where: {
        checkInDate: { lt: chkOut },
        checkOutDate: { gt: chkIn },
        bookingStatus: { not: "CANCELED" },
      },
      select: { campSiteId: true },
    });

    conflictIds = [...new Set(booked.map((b) => b.campSiteId).filter(Boolean))];
  }

  // 2️⃣ Facility filter
  const facilityNums = (facilityIds || [])
    .map(Number)
    .filter((n) => Number.isFinite(n));
  let facilityJoin = "";
  let facilityHaving = "";

  if (facilityNums.length) {
    const csv = facilityNums.join(",");
    facilityJoin = `JOIN "CampSiteFacility" csf ON csf."campId" = cs."id"`;
    facilityHaving = `
      GROUP BY cs."id"
      HAVING COUNT(DISTINCT csf."facilityId") = ${facilityNums.length}
        AND bool_and(csf."facilityId" = ANY(ARRAY[${csv}]::int[]))
    `;
  }

  // 3️⃣ Price & capacity filters
  const capacityFilters = [
    `cs."maxAdult" >= ${adultsN}`,
    `cs."maxChildren" >= ${childrenN}`,
    `cs."maxPets" >= ${petsN}`,
    `cs."isAvailable" = true`,
  ];
  if (minPrice !== undefined && minPrice !== "") {
    capacityFilters.push(`cs."pricePerNight" >= ${Number(minPrice)}`);
  }
  if (maxPrice !== undefined && maxPrice !== "") {
    capacityFilters.push(`cs."pricePerNight" <= ${Number(maxPrice)}`);
  }

  const priceCapClause = capacityFilters.length
    ? "AND " + capacityFilters.join(" AND ")
    : "";
  const conflictClause = conflictIds.length
    ? `AND cs."id" NOT IN (${conflictIds.join(",")})`
    : "";

  // 4️⃣ Prefix search term for tsvector
  const searchTerm = q ? q.trim().replace(/\s+/g, " & ") + ":*" : null;

  // 5️⃣ SQL query
  const sql = `
    SELECT 
      cs.id, cs.name, cs.description, cs."pricePerNight",
      cs."maxAdult", cs."maxChildren", cs."maxPets", cs."isAvailable",
      cs.images, cs."hostId", cs."location", cs."latitude", cs."longitude",
      cs."createdAt", cs."updatedAt"
    FROM "CampSite" cs
    ${facilityJoin}
    WHERE 1=1
      ${
        searchTerm
          ? `AND cs."search_vector" @@ to_tsquery('${searchTerm}')`
          : ""
      }
      ${priceCapClause ? priceCapClause : ""}
      ${conflictClause ? conflictClause : ""}
    ${facilityHaving}
    ${
      sort === "price_asc"
        ? `ORDER BY cs."pricePerNight" ASC`
        : sort === "price_desc"
        ? `ORDER BY cs."pricePerNight" DESC`
        : searchTerm
        ? `ORDER BY ts_rank(cs."search_vector", to_tsquery('${searchTerm}')) DESC`
        : `ORDER BY cs."createdAt" DESC`
    }
    OFFSET ${skip} LIMIT ${take};
  `;

  const countSql = `
    SELECT COUNT(DISTINCT cs."id") as total
    FROM "CampSite" cs
    ${facilityJoin}
    WHERE 1=1
      ${
        searchTerm
          ? `AND cs."search_vector" @@ to_tsquery('${searchTerm}')`
          : ""
      }
      ${priceCapClause ? priceCapClause : ""}
      ${conflictClause ? conflictClause : ""}
    ${facilityHaving};
  `;

  // 6️⃣ Execute queries
  const rows = await prisma.$queryRawUnsafe(sql);
  const countRes = await prisma.$queryRawUnsafe(countSql);
  const total = countRes && countRes[0] ? Number(countRes[0].total) : 0;

  // 7️⃣ Attach facilities
  const campIds = rows.map((r) => r.id).filter(Boolean);
  let results = rows;

  if (campIds.length) {
    const cf = await prisma.campSiteFacility.findMany({
      where: { campId: { in: campIds } },
      include: { facility: true },
    });

    const facilitiesMap = {};
    cf.forEach((item) => {
      facilitiesMap[item.campId] = facilitiesMap[item.campId] || [];
      facilitiesMap[item.campId].push(item.facility);
    });

    results = rows.map((r) => ({
      ...r,
      facilities: facilitiesMap[r.id] || [],
    }));
  }

  return {
    total,
    page: Number(page),
    perPage: take,
    results,
  };
};
