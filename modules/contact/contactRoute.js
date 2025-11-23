import { Router } from "express";
import {saveContactController,getContactController} from "./contactController.js"
const contactRoute = Router()

contactRoute.post("/contact/new",saveContactController)
contactRoute.patch("/contact/update",saveContactController)
contactRoute.get("/contact/all",getContactController)

export default contactRoute