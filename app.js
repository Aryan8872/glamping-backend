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
import experienceRoute from "./modules/experiences/experienceRoute.js";
import destinationRoute from "./modules/destinations/destinationRoute.js";

import cookieParser from "cookie-parser";
import authRoute from "./modules/auth/authRoute.js";

dotenv.config();
const app = express();
const port = 8080;

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const allowedOrigins = ["http://localhost:3000", "http://localhost:3001"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }),
);
app.use(express.json());
app.use(
  authRoute,
  userroute,
  blogRoute,
  galleryRoute,
  contactRoute,
  aboutUsRoute,
  bookingRoute,
  campRoute,
  facilityRoute,
  dashboardRoute,
  adventureRoute,
  discountRoute,
  experienceRoute,
  destinationRoute,
);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);

  // Handle custom AppError instances
  if (err.status) {
    return res.status(err.status).json({
      message: err.message,
      code: err.code,
      ...(err.extras && { extras: err.extras }),
    });
  }

  // Handle validation errors (already formatted by validateRequest middleware)
  if (err.errors) {
    return res.status(400).json({
      message: err.message || "Validation Error",
      errors: err.errors,
    });
  }

  // Default error response
  res.status(500).json({
    message: err.message || "Internal Server Error",
  });
});

app.listen(port, () => {
  console.log(`server running at ${port}`);
});
