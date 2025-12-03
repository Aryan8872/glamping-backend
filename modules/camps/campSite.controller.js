import { campSiteService } from "./campSite.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { mapFilesToPaths } from "../../utils/uploads/mapFiles.js";
import { getCache, setCache } from "../../utils/cache.js";
import { makeSearchCacheKey } from "../../utils/cacheKey.js";
import { safeParseArray } from "../../utils/safeParseArray.js";

  export const createCampSite = asyncHandler(async (req, res) => {
    const body = req.body || {};

    const campImages = req.files?.campImages
      ? mapFilesToPaths(req.files?.campImages)
      : [];

    const facilities = safeParseArray(body.facilities);

    const payload = {
      ...body,
      hostId: body.hostId ? Number(body.hostId) : null,
      images: campImages,
      facilities,
    };

    const newCamp = await campSiteService.createCampSite(payload);

    res.status(201).json({
      message: "CampSite created successfully",
      data: newCamp,
    });
  });

export const getAllCampSites = asyncHandler(async (req, res) => {
  const camps = await campSiteService.getAllCampSites();
  res.json({ message: "CampSites fetched", data: camps });
});

export const getCampSiteById = asyncHandler(async (req, res) => {
  const camp = await campSiteService.getCampSiteById(Number(req.params.id));

  if (!camp) {
    return res.status(404).json({ message: "CampSite not found" });
  }

  res.json({ message: "CampSite found", data: camp });
});

export const updateCampSite = asyncHandler(async (req, res) => {
  const body = req.body || {};

  const removedImages = safeParseArray(body.removedImages);
  const images = safeParseArray(body.images);
  const newFacilities = safeParseArray(body.newFacilities);
  const newImages = req.files?.campImages
    ? mapFilesToPaths(req.files.campImages)
    : [];

  const facilities = safeParseArray(body.facilities)

  const payload = {
    ...body,
    hostId: body.hostId ? Number(body.hostId) : null, // null removes host
    removedImages,
    images,
    newFacilities,
    newImages,
    facilities,
  };

  const camp = await campSiteService.updateCampSite(
    Number(req.params.id),
    payload
  );

  res.json({ message: "CampSite updated", data: camp });
});

export const deleteCampSite = asyncHandler(async (req, res) => {
  await campSiteService.deleteCampSite(Number(req.params.id));

  res.json({ message: "CampSite deleted successfully" });
});

export const searchCampsController = asyncHandler(async (req, res) => {
  const src = req.validated ?? req.query;

  const facilityIds = src.facilityIds
    ? src.facilityIds.split(",").filter(Boolean)
    : [];

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
  };

  const cacheKey = makeSearchCacheKey(options);
  const useCache = !(options.checkIn && options.checkOut);

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
  result = await campSiteService.searchCamp(options);

  // Cache response
  await setCache(cacheKey, result, useCache ? 300 : 30);

  res.json({
    message: "searched campsite successfully",
    data: result.results ?? [],
    total: result.total ?? 0,
    page: result.page ?? 1,
    perPage: result.perPage ?? options.perPage,
  });
});
