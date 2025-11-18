import { Router } from "express";
import { createContactController, getContactController, updateContactController } from "../controllers/contactController.js";

const contactRoute = Router()

contactRoute.post("/contact/new",createContactController)
contactRoute.patch("/contact/update/:contactId",updateContactController)
contactRoute.get("/contact/all",getContactController)

export default contactRoute