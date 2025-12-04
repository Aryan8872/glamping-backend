import { Router } from "express";
import { getDashboardStatsController } from "./dashboardController.js";

const dashboardRoute = Router();

dashboardRoute.get("/dashboard/stats", getDashboardStatsController);

export default dashboardRoute;
