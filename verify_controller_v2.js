import { createAdventureController } from "./modules/adventure/adventureController.js";
import * as adventureService from "./modules/adventure/adventureService.js";

// Mock adventureService
adventureService.createAdventure = async (data) => {
  console.log("Service received data:", data);
  return { id: 1, ...data };
};

// Mock req and res
const req = {
  body: {
    name: "Test Adventure",
    description: "Description must be long enough",
    title: "Test Title",
    pageDescription: "Page description must be long enough",
    isActive: "true",
  },
  files: {
    adventureCoverImage: [{ path: "uploads/cover.jpg" }],
    adventureBannerImage: [{ path: "uploads/banner.jpg" }],
  },
};

const res = {
  status: (code) => ({
    json: (data) => console.log(`Response ${code}:`, data),
  }),
  json: (data) => console.log("Response:", data),
};

// Run controller
try {
  await createAdventureController(req, res);
} catch (error) {
  console.error("Controller error:", error);
}
