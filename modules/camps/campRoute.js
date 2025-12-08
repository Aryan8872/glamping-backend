import { Router } from "express";
import {
  createCampController,
  getAllCampsController,
  getCampByIdController,
  updateCampController,
  deleteCampController,
  searchCampsController,
} from "./campController.js";
import createMulter from "../../utils/uploads/multerFactory.js";

import {
  createCampSchema,
  updateCampSchema,
  searchCampSchema,
} from "./campValidation.js";

const campRoute = Router();
const upload = createMulter("campsite", {
  allowedTypes: ["image/jpeg", "image/png", "image/webp"],
  maxSizeBytes: 5 * 1024 * 1024,
});

campRoute.post(
  "/campsite/new",
  upload.fields([{ name: "campImages", maxCount: 10 }]),

  createCampController
);

campRoute.get("/campsite/all", getAllCampsController);

campRoute.get(
  "/campsite/search",

  searchCampsController
);

campRoute.get("/campsite/:id", getCampByIdController);

campRoute.put(
  "/campsite/:id",
  upload.fields([{ name: "campImages", maxCount: 10 }]),

  updateCampController
);

campRoute.delete("/campsite/:id", deleteCampController);

export default campRoute;
