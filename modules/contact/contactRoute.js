import { Router } from "express";
import {
  getContactController,
  updateContactController,
} from "./contactController.js";

import { updateContactSchema } from "./contactValidation.js";
import { validateRequest } from "../../middleware/validateRequest.js";

const contactRoute = Router();

contactRoute.get("/contact", getContactController);
contactRoute.patch(
  "/contact",
  validateRequest(updateContactSchema),
  updateContactController,
);

export default contactRoute;
