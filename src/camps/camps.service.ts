import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { safeDelete } from '../upload/upload.utils.js';

@Injectable()
export class CampsService {
  constructor(private readonly prisma: PrismaService) {}

  // CREATE CAMPSITE
  async createCampSite(data: any) {
    const slugBase = data.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-]/g, '');
    const slug = `${slugBase}-${Date.now().toString().slice(-5)}`;

    let adventureIds: number[] = [];
    if (data.adventureIds) {
      if (Array.isArray(data.adventureIds)) {
        adventureIds = data.adventureIds.map(Number).filter((n: number) => Number.isFinite(n));
      }
    }

    let experienceIds: number[] = [];
    if (data.experienceIds) {
      if (Array.isArray(data.experienceIds)) {
        experienceIds = data.experienceIds.map(Number).filter((n: number) => Number.isFinite(n));
      }
    }

    const facilitiesToConnect: any[] = [];
    const facilitiesToCreate: any[] = [];

    if (Array.isArray(data.facilities)) {
      data.facilities.forEach((f: any) => {
        if (f.id) {
          facilitiesToConnect.push({ id: f.id });
        } else if (f.name && f.icon && f.slug) {
          facilitiesToCreate.push({ name: f.name, icon: f.icon, slug: f.slug });
        }
      });
    }

    if (Array.isArray(data.newFacilities)) {
      data.newFacilities.forEach((f: any) => {
        if (f.name && f.icon) {
          const fSlug = `${f.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
          facilitiesToCreate.push({ name: f.name, icon: f.icon, slug: fSlug });
        }
      });
    }

    let connectHost: any = undefined;
    if (data.hostId) {
      const user = await this.prisma.user.findUnique({ where: { id: data.hostId } });
      if (!user) throw new BadRequestException('Host user not found');
      if (user.userType !== 'CAMPHOST') throw new BadRequestException('Assigned user is not a CampHost');
      connectHost = { connect: { id: user.id } };
    }

    if (data.isFeatured) {
      await this.prisma.campSite.updateMany({
        where: { isFeatured: true },
        data: { isFeatured: false },
      });
    }

    return this.prisma.campSite.create({
      data: {
        name: data.name,
        description: data.description,
        pricePerNight: data.pricePerNight,
        slug,
        images: data.images || [],
        location: data.location ?? null,
        latitude: data.latitude != null ? parseFloat(data.latitude) : null,
        longitude: data.longitude != null ? parseFloat(data.longitude) : null,
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
            ...facilitiesToConnect.map((f: any) => ({ facility: { connect: f } })),
            ...facilitiesToCreate.map((f: any) => ({ facility: { create: f } })),
          ],
        },
        adventures: {
          create: adventureIds.map((id: number) => ({ adventure: { connect: { id } } })),
        },
        experiences: {
          create: experienceIds.map((id: number) => ({ experience: { connect: { id } } })),
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
  }

  // GET ALL CAMPS
  async getAllCampSites() {
    return this.prisma.campSite.findMany({
      include: {
        campSiteFacilities: {
          include: { facility: { select: { id: true, name: true, icon: true } } },
        },
        campHost: {
          select: { id: true, fullName: true, profilePicture: true, email: true, phoneNumber: true, userStatus: true },
        },
        adventures: { include: { adventure: true } },
        experiences: { include: { experience: true } },
        destination: true,
      },
    });
  }

  // GET BY ID
  async getCampSiteById(id: number) {
    const campId = Number(id);
    if (!Number.isFinite(campId)) return null;

    const camp = await this.prisma.campSite.findUnique({
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
          orderBy: { startsAt: 'desc' },
        },
      },
    });

    if (!camp) return null;

    const adventureIdsList = camp.adventures.map((a) => a.adventureId);
    const adventureDiscounts = await this.prisma.discount.findMany({
      where: {
        adventureId: { in: adventureIdsList },
        active: true,
        startsAt: { lte: new Date() },
        OR: [{ endsAt: null }, { endsAt: { gte: new Date() } }],
      },
      orderBy: { startsAt: 'desc' },
    });

    const allDiscounts = [...camp.discounts, ...adventureDiscounts].sort(
      (a, b) => b.startsAt.getTime() - a.startsAt.getTime(),
    );

    const price = Number(camp.pricePerNight);
    let discountedPrice = price;
    let discountPercentage = 0;

    if (allDiscounts.length > 0) {
      const d = allDiscounts[0];
      if (d.type === 'PERCENTAGE') {
        discountedPrice = price - (price * d.amount) / 100;
        discountPercentage = d.amount;
      } else if (d.type === 'FIXED') {
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
  }

  // UPDATE CAMPSITE
  async updateCampSite(id: number, data: any) {
    const campsite = await this.prisma.campSite.findUnique({ where: { id } });
    if (!campsite) throw new BadRequestException('Campsite not found');

    let adventureIds: number[] = [];
    if (data.adventureIds) {
      if (Array.isArray(data.adventureIds)) {
        adventureIds = data.adventureIds.map(Number).filter((n: number) => Number.isFinite(n));
      } else {
        try {
          const parsed = JSON.parse(data.adventureIds);
          adventureIds = parsed.map(Number).filter((n: number) => Number.isFinite(n));
        } catch { adventureIds = []; }
      }
    }

    let experienceIds: number[] = [];
    if (data.experienceIds) {
      if (Array.isArray(data.experienceIds)) {
        experienceIds = data.experienceIds.map(Number).filter((n: number) => Number.isFinite(n));
      } else {
        try {
          const parsed = JSON.parse(data.experienceIds);
          experienceIds = parsed.map(Number).filter((n: number) => Number.isFinite(n));
        } catch { experienceIds = []; }
      }
    }

    if (data.removedImages?.length) {
      await safeDelete(data.removedImages);
    }

    let finalImages = campsite.images;
    if (Array.isArray(data.images)) finalImages = data.images;
    if (Array.isArray(data.newImages) && data.newImages.length) {
      finalImages = [...finalImages, ...data.newImages];
    }

    const facilitiesToConnect: any[] = [];
    const facilitiesToCreate: any[] = [];

    if (Array.isArray(data.facilities)) {
      data.facilities.forEach((f: any) => {
        if (f.id) facilitiesToConnect.push({ id: f.id });
      });
    }

    if (Array.isArray(data.newFacilities)) {
      data.newFacilities.forEach((f: any) => {
        const fSlug = `${f.name} + ${Date.now()}`;
        facilitiesToCreate.push({ name: f.name, icon: f.icon, slug: fSlug });
      });
    }

    let hostOperation: any = undefined;
    if (data.hostId !== undefined) {
      if (data.hostId) {
        const user = await this.prisma.user.findUnique({ where: { id: data.hostId } });
        if (!user) throw new BadRequestException('Host user not found');
        if (user.userType !== 'CAMPHOST') throw new BadRequestException('Assigned user is not a CampHost');
        hostOperation = { connect: { id: user.id } };
      } else {
        hostOperation = { disconnect: true };
      }
    }

    if (data.isFeatured) {
      await this.prisma.campSite.updateMany({
        where: { isFeatured: true, id: { not: id } },
        data: { isFeatured: false },
      });
    }

    const updateData: any = {
      name: data.name ?? campsite.name,
      description: data.description ?? campsite.description,
      pricePerNight: data.pricePerNight ?? campsite.pricePerNight,
      maxAdult: data.maxAdult ?? campsite.maxAdult,
      maxChildren: data.maxChildren ?? campsite.maxChildren,
      maxPets: data.maxPets ?? campsite.maxPets,
      isFeatured: data.isFeatured ?? campsite.isFeatured,
      images: finalImages,
      location: data.location !== undefined ? data.location : campsite.location,
      latitude: data.latitude !== undefined
        ? (data.latitude !== null ? parseFloat(data.latitude) : null)
        : campsite.latitude,
      longitude: data.longitude !== undefined
        ? (data.longitude !== null ? parseFloat(data.longitude) : null)
        : campsite.longitude,
    };

    if (hostOperation) updateData.campHost = hostOperation;

    if (data.destinationId !== undefined) {
      updateData.destination = data.destinationId
        ? { connect: { id: Number(data.destinationId) } }
        : { disconnect: true };
    }

    return this.prisma.campSite.update({
      where: { id },
      data: {
        ...updateData,
        campSiteFacilities: {
          deleteMany: { campId: id },
          create: [
            ...facilitiesToConnect.map((f: any) => ({ facility: { connect: f } })),
            ...facilitiesToCreate.map((f: any) => ({ facility: { create: f } })),
          ],
        },
        adventures: {
          deleteMany: { campId: id },
          create: adventureIds.map((advId: number) => ({ adventure: { connect: { id: advId } } })),
        },
        experiences: {
          deleteMany: { campId: id },
          create: experienceIds.map((expId: number) => ({ experience: { connect: { id: expId } } })),
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
  }

  // DELETE CAMP
  async deleteCampSite(id: number) {
    const camp = await this.prisma.campSite.findUnique({
      where: { id },
      select: { images: true },
    });

    const result = await this.prisma.campSite.delete({ where: { id } });

    if (camp?.images?.length) {
      safeDelete(camp.images).catch((err) => {
        console.error(`Failed to delete images for camp ${id}:`, err);
      });
    }

    return result;
  }

  // SEARCH CAMP (raw SQL for full-text search)
  async searchCamp(options: {
    q?: string;
    page?: number;
    perPage?: number;
    children?: number;
    adults?: number;
    pets?: number;
    minPrice?: number;
    maxPrice?: number;
    facilityIds?: number[];
    checkIn?: string;
    checkOut?: string;
    experience?: string;
    destination?: string;
    sort?: string;
    isFeatured?: boolean;
    ignoreAvailability?: boolean;
  }) {
    const {
      q, page = 1, perPage = 12, children = 0, adults = 0, pets = 0,
      minPrice, maxPrice, facilityIds = [], checkIn, checkOut,
      experience, destination, sort = 'relevance', isFeatured,
      ignoreAvailability = false,
    } = options;

    const take = Math.max(1, Number(perPage) || 12);
    const skip = (Math.max(1, Number(page)) - 1) * take;

    const adultsN = Math.max(0, Number(adults));
    const childrenN = Math.max(0, Number(children));
    const petsN = Math.max(0, Number(pets));

    const values: any[] = [];
    let paramIndex = 1;
    const getParam = (val: any) => { values.push(val); return `$${paramIndex++}`; };

    const filters: string[] = [];
    if (!ignoreAvailability) filters.push(`cs."isAvailable" = true`);

    if (adultsN > 0) filters.push(`cs."maxAdult" >= ${getParam(adultsN)}`);
    if (childrenN > 0) filters.push(`cs."maxChildren" >= ${getParam(childrenN)}`);
    if (petsN > 0) filters.push(`cs."maxPets" >= ${getParam(petsN)}`);

    if (isFeatured !== undefined) {
      filters.push(`cs."isFeatured" = ${getParam(isFeatured === true)}`);
    }

    if (minPrice !== undefined && minPrice !== ('' as any)) {
      filters.push(`cs."pricePerNight" >= ${getParam(Number(minPrice))}`);
    }
    if (maxPrice !== undefined && maxPrice !== ('' as any)) {
      filters.push(`cs."pricePerNight" <= ${getParam(Number(maxPrice))}`);
    }

    if (destination) {
      if (Number.isFinite(Number(destination))) {
        filters.push(`cs."destinationId" = ${getParam(Number(destination))}`);
      } else {
        filters.push(`EXISTS (
          SELECT 1 FROM "Destination" d 
          WHERE d.id = cs."destinationId" 
          AND (d.slug = ${getParam(destination)} OR cs."location" ILIKE ${getParam(`%${destination}%`)})
        )`);
      }
    }

    if (experience) {
      if (Number.isFinite(Number(experience))) {
        filters.push(`EXISTS (
          SELECT 1 FROM "CampSiteExperience" cse 
          WHERE cse."campId" = cs.id AND cse."experienceId" = ${getParam(Number(experience))}
        )`);
      } else {
        filters.push(`EXISTS (
          SELECT 1 FROM "CampSiteExperience" cse 
          INNER JOIN "Experience" e ON e.id = cse."experienceId"
          WHERE cse."campId" = cs.id AND e.slug = ${getParam(experience)}
        )`);
      }
    }

    const facilityNums = (facilityIds || []).map(Number).filter((n) => Number.isFinite(n));
    if (facilityNums.length) {
      filters.push(`(
        SELECT COUNT(DISTINCT csf."facilityId") 
        FROM "CampSiteFacility" csf 
        WHERE csf."campId" = cs.id 
        AND csf."facilityId" = ANY(${getParam(facilityNums)})
      ) = ${facilityNums.length}`);
    }

    let textRankSelect = '';
    if (q && q.trim()) {
      const searchTerm = q.trim().replace(/\s+/g, ' & ') + ':*';
      const tsParam = getParam(searchTerm);
      filters.push(`(
        cs."search_vector" @@ to_tsquery(${tsParam})
        OR cs."location" ILIKE ${getParam(`%${q}%`)}
        OR EXISTS (
          SELECT 1 FROM "Destination" d 
          WHERE d.id = cs."destinationId" AND d.name ILIKE ${getParam(`%${q}%`)}
        )
      )`);
      textRankSelect = `, ts_rank(cs."search_vector", to_tsquery(${tsParam})) as rank`;
    }

    const whereClause = filters.length ? 'WHERE ' + filters.join(' AND ') : '';

    let orderBy = `ORDER BY cs."createdAt" DESC`;
    if (sort === 'price_asc') orderBy = `ORDER BY cs."pricePerNight" ASC`;
    else if (sort === 'price_desc') orderBy = `ORDER BY cs."pricePerNight" DESC`;
    else if (q && q.trim()) orderBy = `ORDER BY rank DESC`;

    // Snapshot filter-only values BEFORE adding LIMIT/OFFSET params
    const filterValues = [...values];

    const sql = `
      WITH filtered_camps AS (
        SELECT cs.id ${textRankSelect}
        FROM "CampSite" cs
        ${whereClause}
        ${orderBy}
        LIMIT ${getParam(take)} OFFSET ${getParam(skip)}
      )
      SELECT 
        cs.id, cs.name, cs.description, cs."pricePerNight",
        cs."maxAdult", cs."maxChildren", cs."maxPets", cs."isAvailable",
        cs.images, cs."hostId", cs."location", cs."latitude", cs."longitude",
        cs."createdAt", cs."updatedAt",
        d.amount AS "discountAmount",
        d.type AS "discountType",
        d.name AS "discountName",
        dest.name AS "destinationName"
        ${textRankSelect ? ', fc.rank' : ''}
      FROM filtered_camps fc
      JOIN "CampSite" cs ON cs.id = fc.id
      LEFT JOIN "Destination" dest ON dest.id = cs."destinationId"
      LEFT JOIN LATERAL (
        SELECT sub_d.amount, sub_d.type, sub_d.name
        FROM "Discount" sub_d
        LEFT JOIN "CampSiteAdventure" csa ON csa."adventureId" = sub_d."adventureId"
        WHERE (sub_d."campId" = cs.id OR csa."campId" = cs.id)
          AND sub_d.active = true
          AND sub_d."startsAt" <= NOW()
          AND (sub_d."endsAt" IS NULL OR sub_d."endsAt" >= NOW())
        ORDER BY sub_d."startsAt" DESC
        LIMIT 1
      ) d ON true
      ${orderBy.replace(/rank/g, 'fc.rank')}
    `;

    const countSql = `
      SELECT COUNT(*) as total
      FROM "CampSite" cs
      ${whereClause}
    `;

    const results: any[] = await this.prisma.$queryRawUnsafe(sql, ...values);
    const countRes: any[] = await this.prisma.$queryRawUnsafe(countSql, ...filterValues);
    const total = countRes?.[0] ? Number(countRes[0].total) : 0;

    const campIds = results.map((r) => r.id);
    let processedResults = results;

    if (campIds.length) {
      const facilities = await this.prisma.campSiteFacility.findMany({
        where: { campId: { in: campIds } },
        include: { facility: true },
      });

      const fMap: Record<number, any[]> = {};
      facilities.forEach((f) => {
        if (!fMap[f.campId]) fMap[f.campId] = [];
        fMap[f.campId].push(f.facility);
      });

      let bookings: any[] = [];
      if (checkIn && checkOut) {
        bookings = await this.prisma.campBookings.findMany({
          where: {
            campSiteId: { in: campIds },
            bookingStatus: 'BOOKED',
            checkInDate: { lt: new Date(checkOut) },
            checkOutDate: { gt: new Date(checkIn) },
          },
        });
      }

      processedResults = results.map((r) => {
        const p = Number(r.pricePerNight);
        let dp = p;
        if (r.discountAmount) {
          if (r.discountType === 'PERCENTAGE') dp = p - (p * r.discountAmount) / 100;
          else dp = p - r.discountAmount;
        }

        let isFullyBooked = false;
        const requestedGuests = Number(adults) + Number(children);
        const campCapacity = (r.maxAdult || 0) + (r.maxChildren || 0);

        if (checkIn && checkOut) {
          const start = new Date(checkIn); start.setHours(0, 0, 0, 0);
          const end = new Date(checkOut); end.setHours(0, 0, 0, 0);
          const campBookings = bookings.filter((b) => b.campSiteId === r.id);

          for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
            const currentDay = new Date(d);
            const dailyBooked = campBookings
              .filter((b: any) => {
                const bIn = new Date(b.checkInDate); bIn.setHours(0, 0, 0, 0);
                const bOut = new Date(b.checkOutDate); bOut.setHours(0, 0, 0, 0);
                return currentDay >= bIn && currentDay < bOut;
              })
              .reduce((sum: number, b: any) => sum + (b.adults || 0) + (b.children || 0), 0);
            if (dailyBooked + requestedGuests > campCapacity) {
              isFullyBooked = true;
              break;
            }
          }
        }

        return {
          ...r,
          pricePerNight: p,
          originalPrice: p,
          discountedPrice: Math.max(0, dp),
          discountPercentage:
            r.discountType === 'PERCENTAGE'
              ? r.discountAmount
              : r.discountAmount ? Math.round((r.discountAmount / p) * 100) : 0,
          facilities: fMap[r.id] || [],
          isFullyBooked,
        };
      });
    }

    return {
      total,
      page: Number(page),
      limit: take,
      totalPages: Math.ceil(total / take),
      hasMore: skip + take < total,
      results: processedResults,
    };
  }
}
