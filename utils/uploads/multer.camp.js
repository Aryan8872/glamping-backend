import createMulter from "./multerFactory.js";

export const uploadCamp = createMulter("camp", {
  allowedTypes: ["image/jpeg", "image/png", "image/webp"],
  maxSizeBytes: 5 * 1024 * 1024, // 5MB per file
  maxFiles: 20,
});

export const campUploadMiddleware = uploadCamp.fields([
  { name: "campImages", maxCount: 20 },
]);
