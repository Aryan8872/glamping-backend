import * as dashboardService from "./dashboardService.js";
export const getDashboardStatsController = async (req, res) => {
  const stats = await dashboardService.getDashboardStats();
  res.json({ data: stats });
};
