import { Router } from "express";
import { getAboutUsController, saveAboutUsController, updateAboutUsController } from "../controllers/aboutUsController.js";

const aboutUsRoute = Router()

aboutUsRoute.post("/about/new",saveAboutUsController)
aboutUsRoute.get("/about/all",getAboutUsController)
aboutUsRoute.patch("/about/update",saveAboutUsController)

export default aboutUsRoute
