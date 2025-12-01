// src/utils/cacheKey.js
export function makeSearchCacheKey(queryObj) {
  const cleaned = {
    q: queryObj.q || "",
    page: queryObj.page || 1,
    perPage: queryObj.perPage || 12,
    minPrice: queryObj.minPrice || "",
    maxPrice: queryObj.maxPrice || "",
    facilityIds: Array.isArray(queryObj.facilityIds)
      ? queryObj.facilityIds.sort()
      : [],
    adults: queryObj.adults || 1,
    children: queryObj.children || 0,
    pets: queryObj.pets || 0,
    sort: queryObj.sort || "relevance",
    checkIn: queryObj.checkIn || "",
    checkOut: queryObj.checkOut || ""
  };

  return "camp_search:" + JSON.stringify(cleaned);
}
