import { Router } from "express";
import {createOrUpdateAboutUs,getAboutUs,updateAboutUsStatController,deleteAboutUsStatController } from "./aboutUsController.js";

const aboutUsRoute = Router()

aboutUsRoute.post("/about/new",createOrUpdateAboutUs)
aboutUsRoute.get("/about/all",getAboutUs)
aboutUsRoute.patch("/about/update",createOrUpdateAboutUs)
aboutUsRoute.put("/stat/update/:statId",updateAboutUsStatController)
aboutUsRoute.delete("/stat/delete/:statId",deleteAboutUsStatController)

export default aboutUsRoute
