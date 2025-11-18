import express from "express"
import userroute from "./routes/userRoute.js"
import cors from "cors"
import dotenv from "dotenv"
import blogRoute from "./routes/blogRoute.js"
import { BlogStatus } from "./utils/types.js"
import galleryRoute from "./routes/galleryRoute.js"
import contactRoute from "./routes/contactRoute.js"
dotenv.config()
const app = express()
const port = 8080


app.use(cors())
app.use(express.json())
app.use(userroute,blogRoute,galleryRoute,contactRoute)
app.listen(port,()=>{
    console.log(`server running at ${port}`)
})