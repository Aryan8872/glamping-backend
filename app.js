import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import userroute from "./modules/user/userRoute.js";
import galleryRoute from "./modules/gallery/galleryRoute.js";
import blogRoute from "./modules/blogs/blogRoute.js";
import contactRoute from "./modules/contact/contactRoute.js";
import aboutUsRoute from "./modules/aboutUs/aboutUsRoute.js";
import bookingRoute from "./modules/bookings/bookingRoute.js";
import campRoute from "./modules/camps/campRoute.js";
import path from "path";
import facilityRoute from "./modules/facility/facilityRoute.js";
import dashboardRoute from "./modules/dashboard/dashboardRoute.js";
import adventureRoute from "./modules/adventure/adventureRoute.js";
import discountRoute from "./modules/discount/discountRoute.js";

dotenv.config();
const app = express();
const port = 8080;

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());
app.use(express.json());
app.use(
  userroute,
  blogRoute,
  galleryRoute,
  contactRoute,
  aboutUsRoute,
  bookingRoute,
  campRoute,
  facilityRoute,
  dashboardRoute,
  contactRoute,
  adventureRoute,
  discountRoute
);
export default app
app.listen(port, () => {
  console.log(`server running at ${port}`);
});
