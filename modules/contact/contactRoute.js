import { Router } from "express";
import {
  getContactController,
  updateContactController,
} from "./contactController.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { updateContactSchema } from "./contactValidation.js";

const contactRoute = Router();

contactRoute.get("/contact", getContactController);
contactRoute.put(
  "/contact",
  validateRequest(updateContactSchema),
  updateContactController
);

export default contactRoute;
