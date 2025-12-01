import express from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as dashboardController from "./dashboardController.js";
const dashboardRoute = express.Router();
dashboardRoute.get("/dashboard/stats", asyncHandler(dashboardController.getDashboardStatsController));
export default dashboardRoute;