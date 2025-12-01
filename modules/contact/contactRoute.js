import express from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as contactController from "./contactController.js";
const contactRoute = express.Router();
contactRoute.get("/contact", asyncHandler(contactController.getContactController));
contactRoute.put("/contact/update", asyncHandler(contactController.updateContactController));
export default contactRoute;