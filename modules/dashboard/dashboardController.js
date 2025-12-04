import * as dashboardService from "./dashboardService.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const getDashboardStatsController = asyncHandler(async (req, res) => {
  const stats = await dashboardService.getDashboardStats();
  res.json({ message: "Dashboard stats", data: stats });
});
