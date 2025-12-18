import prisma from "../../utils/prismaClient.js";
import { removeFile } from "../../utils/uploads/storage.utils.js";
import { safeDelete } from "../../storage/storageTransaction.js";

// CREATE CAMPSITE
export const createCampSite = async (data) => {
  const slugBase = data.name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "");

  const slug = `${slugBase}-${Date.now().toString().slice(-5)}`;

  // Parse adventure IDs
  let adventureIds = [];
  if (data.adventureIds) {
    if (Array.isArray(data.adventureIds)) {
      adventureIds = data.adventureIds
        .map(Number)
        .filter((n) => Number.isFinite(n));
    }
  }

  // Parse Experience IDs
  let experienceIds = [];
  if (data.experienceIds) {
    if (Array.isArray(data.experienceIds)) {
      experienceIds = data.experienceIds
        .map(Number)
        .filter((n) => Number.isFinite(n));
    }
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

  // Handle new facilities
  if (Array.isArray(data.newFacilities)) {
    data.newFacilities.forEach((f) => {
      if (f.name && f.icon) {
        const slug = `${f.name
          .toLowerCase()
          .replace(/\s+/g, "-")}-${Date.now()}`;
        facilitiesToCreate.push({
          name: f.name,
          icon: f.icon,
          slug: slug,
        });
      }
    });
  }

  // Validate hostId
  let connectHost = undefined;
  if (data.hostId) {
    const user = await prisma.user.findUnique({ where: { id: data.hostId } });

    if (!user) throw new Error("Host user not found");
    // Removed strict check for flexibility or re-add if needed
    if (user.userType !== "CAMPHOST")
      throw new Error("Assigned user is not a CampHost");

    connectHost = { connect: { id: user.id } };
  }

  // Handle Featured Exclusivity
  if (data.isFeatured) {
    await prisma.campSite.updateMany({
      where: { isFeatured: true },
      data: { isFeatured: false },
    });
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
      destination: data.destinationId
        ? { connect: { id: Number(data.destinationId) } }
        : undefined,
      maxAdult: data.maxAdult,
      maxChildren: data.maxChildren,
      maxPets: data.maxPets,
      isFeatured: data.isFeatured,

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
      experiences: {
        create: (experienceIds || []).map((id) => ({
          experience: { connect: { id: Number(id) } },
        })),
      },
    },
    include: {
      campSiteFacilities: { include: { facility: true } },
      campHost: true,
      adventures: { include: { adventure: true } },
      experiences: { include: { experience: true } },
      destination: true,
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
      experiences: { include: { experience: true } },
      destination: true,
    },
  });
};

export const getCampSiteById = async (id) => {
  const campId = Number(id);
  if (!Number.isFinite(campId)) return null;

  const camp = await prisma.campSite.findUnique({
    where: { id: campId },
    include: {
      campSiteFacilities: { include: { facility: true } },
      campHost: true,
      adventures: { include: { adventure: true } },
      experiences: { include: { experience: true } },
      destination: true,
      discounts: {
        where: {
          active: true,
          startsAt: { lte: new Date() },
          OR: [{ endsAt: null }, { endsAt: { gte: new Date() } }],
        },
        orderBy: { startsAt: "desc" },
      },
    },
  });

  if (!camp) return null;

  // 1️⃣ Fetch discounts from linked adventures
  const adventureIds = camp.adventures.map((a) => a.adventureId);
  const adventureDiscounts = await prisma.discount.findMany({
    where: {
      adventureId: { in: adventureIds },
      active: true,
      startsAt: { lte: new Date() },
      OR: [{ endsAt: null }, { endsAt: { gte: new Date() } }],
    },
    orderBy: { startsAt: "desc" },
  });

  // 2️⃣ Merge and pick the best discount
  const allDiscounts = [...camp.discounts, ...adventureDiscounts].sort(
    (a, b) => b.startsAt - a.startsAt
  );

  // Calculate Discount
  const price = Number(camp.pricePerNight);
  let discountedPrice = price;
  let discountPercentage = 0;

  if (allDiscounts && allDiscounts.length > 0) {
    const d = allDiscounts[0];
    if (d.type === "PERCENTAGE") {
      discountedPrice = price - (price * d.amount) / 100;
      discountPercentage = d.amount;
    } else if (d.type === "FIXED") {
      discountedPrice = price - d.amount;
      discountPercentage = Math.round((d.amount / price) * 100);
    }
  }

  return {
    ...camp,
    pricePerNight: price,
    originalPrice: price,
    discountedPrice: Math.max(0, discountedPrice),
    discountPercentage,
    discountName: allDiscounts?.[0]?.name,
  };
};

// UPDATE CAMPSITE
export const updateCampSite = async (id, data) => {
  const campsite = await prisma.campSite.findUnique({ where: { id } });
  if (!campsite) throw new Error("Campsite not found");

  // Parse adventure IDs
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

  // Parse Experience IDs
  let experienceIds = [];
  if (data.experienceIds) {
    if (Array.isArray(data.experienceIds)) {
      experienceIds = data.experienceIds
        .map(Number)
        .filter((n) => Number.isFinite(n));
    } else {
      try {
        const parsed = JSON.parse(data.experienceIds);
        experienceIds = parsed.map(Number).filter((n) => Number.isFinite(n));
      } catch {
        experienceIds = [];
      }
    }
  }

  // Delete removed images from storage
  if (data.removedImages?.length) {
    await safeDelete(data.removedImages);
  }

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

  // Handle Host Assignment
  let hostOperation = undefined;
  if (data.hostId) {
    const user = await prisma.user.findUnique({ where: { id: data.hostId } });
    if (!user) throw new Error("Host user not found");
    if (user.userType !== "CAMPHOST")
      throw new Error("Assigned user is not a CampHost");
    hostOperation = { connect: { id: user.id } };
  } else {
    hostOperation = { disconnect: true };
  }

  // Handle Featured Exclusivity
  if (data.isFeatured) {
    await prisma.campSite.updateMany({
      where: { isFeatured: true, id: { not: id } },
      data: { isFeatured: false },
    });
  }

  return await prisma.campSite.update({
    where: { id },
    data: {
      name: data.name ?? campsite.name,
      description: data.description ?? campsite.description,
      pricePerNight: data.pricePerNight ?? campsite.pricePerNight,
      maxAdult: data.maxAdult ?? campsite.maxAdult,
      maxChildren: data.maxChildren ?? campsite.maxChildren,
      maxPets: data.maxPets ?? campsite.maxPets,
      isFeatured: data.isFeatured ?? campsite.isFeatured,
      images: finalImages,
      campHost: hostOperation,
      location: data.location !== undefined ? data.location : campsite.location,
      destination: data.destinationId
        ? { connect: { id: Number(data.destinationId) } }
        : { disconnect: true },
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
          ...facilitiesToConnect.map((f) => ({ facility: { connect: f } })),
          ...facilitiesToCreate.map((f) => ({ facility: { create: f } })),
        ],
      },

      adventures: {
        deleteMany: { campId: id },
        create: adventureIds.map((id) => ({ adventure: { connect: { id } } })),
      },

      experiences: {
        deleteMany: { campId: id },
        create: experienceIds.map((id) => ({
          experience: { connect: { id } },
        })),
      },
    },
    include: {
      campSiteFacilities: { include: { facility: true } },
      campHost: true,
      adventures: { include: { adventure: true } },
      experiences: { include: { experience: true } },
      destination: true,
    },
  });
};
export const getFeaturedCampService = async () => {
  return prisma.campSite.findMany({
    where: { isFeatured: true },
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
      experiences: { include: { experience: true } },
      destination: true,
    },
  });
};
// DELETE CAMP
export const deleteCampSite = async (id) => {
  // Fetch camp to get image URLs before deletion
  const camp = await prisma.campSite.findUnique({
    where: { id },
    select: { images: true },
  });

  // Delete from database
  const result = await prisma.campSite.delete({ where: { id } });

  // Delete associated images from storage (non-blocking)
  if (camp?.images?.length) {
    safeDelete(camp.images).catch((err) => {
      console.error(`⚠️ Failed to delete images for camp ${id}:`, err);
    });
  }

  return result;
};

// SEARCH CAMP
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
  experience, // slug or id
  destination, // slug or id
  sort = "relevance",
  isFeatured,
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
      GROUP BY cs."id", d.amount, d.type, d.name, dest.name 
      HAVING COUNT(DISTINCT csf."facilityId") = ${facilityNums.length}
        AND bool_and(csf."facilityId" = ANY(ARRAY[${csv}]::int[]))
    `;
  }

  // 3️⃣ Filters (Price, Capacity, Experience, Destination)
  const filters = [`cs."isAvailable" = true`];

  // Only apply capacity filters if values are explicitly provided
  if (adultsN && adultsN > 0) {
    filters.push(`cs."maxAdult" >= ${adultsN}`);
  }
  if (childrenN && childrenN > 0) {
    filters.push(`cs."maxChildren" >= ${childrenN}`);
  }
  if (petsN && petsN > 0) {
    filters.push(`cs."maxPets" >= ${petsN}`);
  }

  if (isFeatured !== undefined) {
    filters.push(
      `cs."isFeatured" = ${isFeatured === "true" || isFeatured === true}`
    );
  }

  if (minPrice !== undefined && minPrice !== "") {
    filters.push(`cs."pricePerNight" >= ${Number(minPrice)}`);
  }
  if (maxPrice !== undefined && maxPrice !== "") {
    filters.push(`cs."pricePerNight" <= ${Number(maxPrice)}`);
  }

  // Destination Filtering (by ID or Slug or direct location match)
  let destJoin = `LEFT JOIN "Destination" dest ON dest.id = cs."destinationId"`;
  if (destination) {
    // If destination is potentially an ID or slug
    if (Number.isFinite(Number(destination))) {
      filters.push(`cs."destinationId" = ${Number(destination)}`);
    } else {
      filters.push(
        `(dest.slug = '${destination}' OR cs."location" ILIKE '%${destination}%')`
      );
    }
  }

  // Experience Filtering - Use WHERE EXISTS to avoid JOIN conflicts
  let expJoin = `LEFT JOIN "CampSiteExperience" csexp ON csexp."campId" = cs.id
                 LEFT JOIN "Experience" exp ON exp.id = csexp."experienceId"`;

  if (experience) {
    // Use WHERE EXISTS subquery for proper filtering without affecting other JOINs
    if (Number.isFinite(Number(experience))) {
      filters.push(`EXISTS (
        SELECT 1 FROM "CampSiteExperience" cse 
        WHERE cse."campId" = cs.id AND cse."experienceId" = ${Number(
          experience
        )}
      )`);
    } else {
      // Filter by slug using EXISTS
      filters.push(`EXISTS (
        SELECT 1 FROM "CampSiteExperience" cse 
        INNER JOIN "Experience" e ON e.id = cse."experienceId"
        WHERE cse."campId" = cs.id AND e.slug = '${experience}'
      )`);
    }
  }

  const whereClause = filters.length ? "AND " + filters.join(" AND ") : "";
  const conflictClause = conflictIds.length
    ? `AND cs."id" NOT IN (${conflictIds.join(",")})`
    : "";

  // Debug logging
  console.log("🔍 Search Filters:", {
    experience,
    destination,
    q,
    filters,
    whereClause,
  });

  // 4️⃣ Search Term
  const searchTerm = q ? q.trim().replace(/\s+/g, " & ") + ":*" : null;

  // 5️⃣ SQL Query
  const sql = `
    SELECT DISTINCT
      cs.id, cs.name, cs.description, cs."pricePerNight",
      cs."maxAdult", cs."maxChildren", cs."maxPets", cs."isAvailable",
      cs.images, cs."hostId", cs."location", cs."latitude", cs."longitude",
      cs."createdAt", cs."updatedAt",
      -- Discount
      d.amount AS "discountAmount",
      d.type AS "discountType",
      d.name AS "discountName",
      -- Destination
      dest.name AS "destinationName"
      ${
        searchTerm
          ? `, ts_rank(cs."search_vector", to_tsquery('${searchTerm}')) as rank`
          : ""
      }
    FROM "CampSite" cs
    ${facilityJoin}
    ${destJoin}
    ${expJoin}
    -- Join active discounts
    LEFT JOIN "CampSiteAdventure" csa ON csa."campId" = cs.id
    LEFT JOIN "Discount" d ON (d."campId" = cs.id OR d."adventureId" = csa."adventureId")
      AND d.active = true 
      AND d."startsAt" <= NOW() 
      AND (d."endsAt" IS NULL OR d."endsAt" >= NOW())
    WHERE 1=1
      ${
        searchTerm
          ? `AND (
              cs."search_vector" @@ to_tsquery('${searchTerm}')
              OR cs."location" ILIKE '%${q}%'
              OR dest."name" ILIKE '%${q}%'
             )`
          : ""
      }
      ${whereClause}
      ${conflictClause}
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

  // Count Query
  const countSql = `
    SELECT COUNT(DISTINCT cs."id") as total
    FROM "CampSite" cs
    ${facilityJoin}
    ${destJoin}
    ${expJoin}
    WHERE 1=1
      ${
        searchTerm
          ? `AND (
              cs."search_vector" @@ to_tsquery('${searchTerm}')
              OR cs."location" ILIKE '%${q}%'
              OR dest."name" ILIKE '%${q}%'
             )`
          : ""
      }
      ${whereClause}
      ${conflictClause}
    ${facilityHaving};
  `;

  const rows = await prisma.$queryRawUnsafe(sql);
  const countRes = await prisma.$queryRawUnsafe(countSql);
  const total = countRes && countRes[0] ? Number(countRes[0].total) : 0;

  // 7️⃣ Attach facilities & Calculate Prices
  const campIds = rows.map((r) => r.id).filter(Boolean);
  let results = rows;

  if (campIds.length) {
    const cf = await prisma.campSiteFacility.findMany({
      where: { campId: { in: campIds } },
      include: { facility: true },
    });

    // Also fetch experiences and destination details if needed?
    // Let's attach just facilities for now as per original code, maybe experiences if UI needs them in card.

    const facilitiesMap = {};
    cf.forEach((item) => {
      facilitiesMap[item.campId] = facilitiesMap[item.campId] || [];
      facilitiesMap[item.campId].push(item.facility);
    });

    results = rows.map((r) => {
      const price = Number(r.pricePerNight);
      let discountedPrice = price;

      if (r.discountAmount) {
        if (r.discountType === "PERCENTAGE") {
          discountedPrice = price - (price * r.discountAmount) / 100;
        } else if (r.discountType === "FIXED") {
          discountedPrice = price - r.discountAmount;
        }
      }

      return {
        ...r,
        pricePerNight: price,
        originalPrice: price,
        discountedPrice: Math.max(0, discountedPrice),
        discountPercentage:
          r.discountType === "PERCENTAGE"
            ? r.discountAmount
            : r.discountAmount
            ? Math.round((r.discountAmount / price) * 100)
            : 0,
        discountName: r.discountName,
        facilities: facilitiesMap[r.id] || [],
        destinationName: r.destinationName,
      };
    });
  }

  return {
    total,
    page: Number(page),
    perPage: take,
    results,
  };
};
