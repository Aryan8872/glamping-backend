import createMulter from "./multerFactory.js";

export const uploadAdventure = createMulter("adventure", {
  allowedTypes: ["image/jpeg", "image/png", "image/webp"],
  maxSizeBytes: 20 * 1024 * 1024, // 20MB per file
  maxFiles: 20,
});

export const adventureUploadMiddleware = uploadAdventure.fields([
  { name: "adventureCoverImage", maxCount: 1 },
  { name: "adventureBannerImage", maxCount: 1 },
]);
