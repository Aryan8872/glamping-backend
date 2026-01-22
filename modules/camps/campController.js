import * as campService from "./campService.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { processUploadedFiles } from "../../utils/uploads/uploadAdapter.js";
import { getCache, setCache } from "../../utils/cache.js";
import { makeSearchCacheKey } from "../../utils/cacheKey.js";
import { safeParseArray } from "../../utils/safeParseArray.js";

export const createCampController = asyncHandler(async (req, res) => {
  const body = req.validated || req.body || {};
  const campImages = req.files?.campImages
    ? await processUploadedFiles(req.files.campImages, "camp")
    : [];

  const facilities = safeParseArray(body.facilities);
  const adventureIds = safeParseArray(body.adventureIds);
  const newFacilities = safeParseArray(body.newFacilities);

  const payload = {
    ...body,
    hostId: body.hostId ? Number(body.hostId) : null,
    images: campImages,
    facilities,
    adventureIds,
    newFacilities,
    maxAdult: body.maxAdult ? Number(body.maxAdult) : 0,
    maxChildren: body.maxChildren ? Number(body.maxChildren) : 0,
    maxPets: body.maxPets ? Number(body.maxPets) : 0,
    isFeatured: body.isFeatured === "true" || body.isFeatured === true,
  };

  const newCamp = await campService.createCampSite(payload);

  res.status(201).json({
    message: "CampSite created successfully",
    data: newCamp,
  });
});

export const getAllCampsController = asyncHandler(async (req, res) => {
  const { q, page, limit, destination, experience, isFeatured } = req.query;
  const result = await campService.searchCamp({
    q,
    page: Number(page) || 1,
    perPage: Number(limit) || 15,
    destination,
    experience,
    isFeatured,
    ignoreAvailability: true,
  });

  res.json({
    message: "CampSites fetched successfully",
    data: result.results,
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
    hasMore: result.hasMore,
  });
});

export const getCampByIdController = asyncHandler(async (req, res) => {
  const camp = await campService.getCampSiteById(Number(req.params.id));

  if (!camp) {
    return res.status(404).json({ message: "CampSite not found" });
  }

  res.json({ message: "CampSite found", data: camp });
});

export const updateCampController = asyncHandler(async (req, res) => {
  const body = req.validated || req.body || {};

  const removedImages = safeParseArray(body.removedImages);
  const images = safeParseArray(body.images);
  const newFacilities = safeParseArray(body.newFacilities);
  const newImages = req.files?.campImages
    ? await processUploadedFiles(req.files.campImages, "camp")
    : [];

  const facilities = safeParseArray(body.facilities);

  const payload = {
    ...body,
    hostId:
      body.hostId !== undefined
        ? body.hostId === ""
          ? null
          : Number(body.hostId)
        : undefined,
    removedImages,
    images,
    newFacilities,
    newImages,
    facilities,
    maxAdult: body.maxAdult !== undefined ? Number(body.maxAdult) : undefined,
    maxChildren:
      body.maxChildren !== undefined ? Number(body.maxChildren) : undefined,
    maxPets: body.maxPets !== undefined ? Number(body.maxPets) : undefined,
    isFeatured:
      body.isFeatured !== undefined
        ? String(body.isFeatured) === "true"
        : undefined,
    pricePerNight:
      body.pricePerNight !== undefined ? Number(body.pricePerNight) : undefined,
    destinationId:
      body.destinationId !== undefined
        ? body.destinationId === ""
          ? null
          : Number(body.destinationId)
        : undefined,
  };

  const camp = await campService.updateCampSite(Number(req.params.id), payload);
  res.json({ message: "CampSite updated successfully", data: camp });
});

export const deleteCampController = asyncHandler(async (req, res) => {
  await campService.deleteCampSite(Number(req.params.id));

  res.json({ message: "CampSite deleted successfully" });
});

export const searchCampsController = asyncHandler(async (req, res) => {
  const src = req.validated ?? req.query;

  let facilityIds = [];
  if (src.facilityIds) {
    if (Array.isArray(src.facilityIds)) {
      facilityIds = src.facilityIds;
    } else if (typeof src.facilityIds === "string") {
      facilityIds = src.facilityIds.split(",").filter(Boolean);
    }
  }

  console.log("🔍 facilityIds after parsing:", facilityIds);

  const options = {
    q: src.q,
    page: Number(src.page || 1),
    perPage: Number(src.limit || 12),
    minPrice: src.minPrice,
    maxPrice: src.maxPrice,
    facilityIds,
    checkIn: src.checkIn,
    checkOut: src.checkOut,
    adults: Number(src.adults || 1),
    children: Number(src.children || 0),
    pets: Number(src.pets || 0),
    sort: src.sort || "relevance",
    experience: src.experience,
    destination: src.destination,
    isFeatured: src.isFeatured,
  };

  console.log("🎯 Controller received:", { src });
  console.log("📦 Options being passed to service:", options);

  const cacheKey = makeSearchCacheKey(options);

  // Disable cache for experience/destination searches during debugging
  const useCache = false; // !(options.checkIn && options.checkOut);

  let result;

  if (useCache) {
    const cached = await getCache(cacheKey);
    if (cached) {
      // Flatten cached response to match frontend expectation
      return res.json({
        message: "from cache searched campsite successfully",
        data: cached.results ?? [],
        total: cached.total ?? 0,
        page: cached.page ?? 1,
        perPage: cached.perPage ?? options.perPage,
      });
    }
  }

  // Fetch from DB
  result = await campService.searchCamp(options);

  // Cache response
  await setCache(cacheKey, result, useCache ? 300 : 30);

  res.json({
    message: "searched campsite successfully",
    data: result.results ?? [],
    total: result.total ?? 0,
    page: result.page ?? 1,
    limit: result.limit ?? options.perPage,
    totalPages: result.totalPages ?? 0,
    hasMore: result.hasMore ?? false,
  });
});
