import { Router } from "express"
import { addUserController } from "../controllers/userController.js"
const userroute = Router()

// route.get("/user/all")
// route.get("/user/:userId")
userroute.get("/user/new",addUserController)
// route.patch("/user/:userId")

export default userroute