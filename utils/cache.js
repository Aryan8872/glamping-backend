// src/utils/cache.js
import redis from "./redis.js";

export async function getCache(key) {
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
}

export async function setCache(key, value, ttl = 300) { // 5 min default
  return redis.set(key, JSON.stringify(value), "EX", ttl);
}
