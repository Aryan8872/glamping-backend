import createMulter from "./multerFactory.js";

export const uploadUser = createMulter("users", {
  allowedTypes: ["image/jpeg", "image/png", "image/webp"],
  maxSizeBytes: 5 * 1024 * 1024, // 5MB limit
  maxFiles: 1,
});

export const userUploadMiddleware = uploadUser.single("profilePicture");
