import prisma from "../../utils/prismaClient.js";
import { BookingStatus } from "../../utils/types.js";
export const getDashboardStats = async () => {
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  // --- Helper: Calculate Percentage Change ---
  const calculateChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };
  // --- 1. Bookings Stats ---
  // Total Bookings (All time)
  const totalBookings = await prisma.campBookings.count();
  // Current Month Bookings (by checkInDate)
  const currentMonthBookings = await prisma.campBookings.count({
    where: {
      checkInDate: {
        gte: currentMonthStart,
        lt: nextMonthStart,
      },
    },
  });
  // Previous Month Bookings (by checkInDate)
  const prevMonthBookings = await prisma.campBookings.count({
    where: {
      checkInDate: {
        gte: prevMonthStart,
        lt: currentMonthStart,
      },
    },
  });
  const bookingsChange = calculateChange(
    currentMonthBookings,
    prevMonthBookings
  );
  // Active Bookings (Status = BOOKED)
  const activeBookings = await prisma.campBookings.count({
    where: { bookingStatus: "BOOKED" },
  });
  // Completed Bookings (Status = BOOKED + Past Checkout)
  const completedBookings = await prisma.campBookings.count({
    where: {
      bookingStatus: "BOOKED",
      checkOutDate: { lt: now },
    },
  });
  // Canceled Bookings
  const canceledBookings = await prisma.campBookings.count({
    where: { bookingStatus: "CANCELED" },
  });
  // --- 2. Revenue Stats ---
  // Total Revenue (All time, CLEARED)
  const totalRevenueAgg = await prisma.campBookings.aggregate({
    where: { paymentStatus: "CLEARED" },
    _sum: { totalPrice: true },
  });
  const totalRevenue = totalRevenueAgg._sum.totalPrice || 0;
  // Current Month Revenue (by checkInDate)
  const currentMonthRevenueAgg = await prisma.campBookings.aggregate({
    where: {
      paymentStatus: "CLEARED",
      checkInDate: {
        gte: currentMonthStart,
        lt: nextMonthStart,
      },
    },
    _sum: { totalPrice: true },
  });
  const currentMonthRevenue = currentMonthRevenueAgg._sum.totalPrice || 0;
  // Previous Month Revenue (by checkInDate)
  const prevMonthRevenueAgg = await prisma.campBookings.aggregate({
    where: {
      paymentStatus: "CLEARED",
      checkInDate: {
        gte: prevMonthStart,
        lt: currentMonthStart,
      },
    },
    _sum: { totalPrice: true },
  });
  const prevMonthRevenue = prevMonthRevenueAgg._sum.totalPrice || 0;
  const revenueChange = calculateChange(
    Number(currentMonthRevenue),
    Number(prevMonthRevenue)
  );
  // Pending Revenue
  const pendingRevenueAgg = await prisma.campBookings.aggregate({
    where: { paymentStatus: "PENDING" },
    _sum: { totalPrice: true },
  });
  const pendingRevenue = pendingRevenueAgg._sum.totalPrice || 0;
  // --- 3. Other Stats ---
  const totalCamps = await prisma.campSite.count();
  const availableCamps = await prisma.campSite.count({
    where: { isAvailable: true },
  });
  const totalUsers = await prisma.user.count();
  // --- 4. Recent Bookings ---
  const recentBookings = await prisma.campBookings.findMany({
    take: 10,
    orderBy: { id: "desc" }, // Order by ID since we don't have createdAt
    include: {
      campSite: {
        select: { name: true, slug: true },
      },
      userInfo: {
        select: { fullName: true, email: true },
      },
    },
  });
  // --- 5. Monthly Revenue Chart (Last 6 Months) ---
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const monthlyRevenue = await prisma.$queryRaw`
    SELECT 
      TO_CHAR("checkInDate", 'YYYY-MM') as month,
      SUM("totalPrice")::float as revenue
    FROM "CampBookings"
    WHERE "paymentStatus" = 'CLEARED'
      AND "checkInDate" >= ${sixMonthsAgo}
    GROUP BY TO_CHAR("checkInDate", 'YYYY-MM')
    ORDER BY month ASC
  `;
  return {
    bookings: {
      total: totalBookings,
      active: activeBookings,
      completed: completedBookings,
      canceled: canceledBookings,
      change: bookingsChange,
    },
    revenue: {
      total: Number(totalRevenue),
      pending: Number(pendingRevenue),
      monthly: monthlyRevenue,
      change: revenueChange,
    },
    camps: {
      total: totalCamps,
      available: availableCamps,
    },
    users: {
      total: totalUsers,
    },
    recentBookings,
  };
};