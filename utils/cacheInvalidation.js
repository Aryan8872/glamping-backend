// src/utils/cacheInvalidation.js
import redis from "./redis.js";

// Delete ALL search caches (lightweight because keys are small)
export async function invalidateSearchCache() {
  const keys = await redis.keys("camp_search:*");
  if (keys.length) {
    await redis.del(...keys);
  }
}
