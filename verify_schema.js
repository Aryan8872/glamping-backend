import { createAdventureSchema } from "./modules/adventure/adventureValidation.js";

const rawData = {
  name: "Test Adventure",
  description: "Description must be long enough",
  title: "Test Title",
  pageDescription: "Page description must be long enough",
  isActive: "true",
  coverImage: "/uploads/cover.jpg",
  bannerImage: "/uploads/banner.jpg",
  slug: "test-adventure",
};

try {
  const result = createAdventureSchema.parse(rawData);
  console.log("✅ Validation passed:", result);
} catch (error) {
  console.error("❌ Validation failed:", error.issues || error.errors);
}
