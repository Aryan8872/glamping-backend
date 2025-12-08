import createMulter from "./multerFactory.js";

export const uploadExperience = createMulter("experience", {
  allowedTypes: ["image/jpeg", "image/png", "image/webp", "image/svg+xml"],
  maxSizeBytes: 10 * 1024 * 1024, // 10MB
  maxFiles: 5,
});

export const experienceUploadMiddleware = uploadExperience.fields([
  { name: "imageUrl", maxCount: 1 },
]);
