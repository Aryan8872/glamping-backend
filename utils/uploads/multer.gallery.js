import createMulter from "./multerFactory.js";

export const uploadGallery = createMulter("gallery", {
  allowedTypes: ["image/jpeg", "image/png", "image/webp"],
  maxSizeBytes: 15 * 1024 * 1024, // 5MB per file
  maxFiles: 20,
});

export const galleryUploadMiddleware = uploadGallery.fields([
  { name: "coverImage", maxCount: 1 },
  { name: "galleryImage", maxCount: 20 },
]);
