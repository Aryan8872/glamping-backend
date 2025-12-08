import { Router } from "express";
import {
  getContactController,
  updateContactController,
} from "./contactController.js";

import { updateContactSchema } from "./contactValidation.js";

const contactRoute = Router();

contactRoute.get("/contact", getContactController);
contactRoute.put(
  "/contact",

  updateContactController
);

export default contactRoute;
