import createMulter from "./multerFactory.js";

export const uploadDestination = createMulter("destination", {
  allowedTypes: ["image/jpeg", "image/png", "image/webp"],
  maxSizeBytes: 10 * 1024 * 1024, // 10MB
  maxFiles: 5,
});

export const destinationUploadMiddleware = uploadDestination.fields([
  { name: "imageUrl", maxCount: 1 },
]);
