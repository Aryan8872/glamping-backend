import prisma from "../../utils/prismaClient.js";
export const getDashboardStats = async () => {
  // Total bookings
  const totalBookings = await prisma.campBookings.count();
  // Active bookings (BOOKED status)
  const activeBookings = await prisma.campBookings.count({
    where: { bookingStatus: "BOOKED" },
  });
  // Completed bookings
  const completedBookings = await prisma.campBookings.count({
    where: { bookingStatus: "COMPLETED" },
  });
  // Canceled bookings
  const canceledBookings = await prisma.campBookings.count({
    where: { bookingStatus: "CANCELED" },
  });
  // Total revenue (from CLEARED payments)
  const revenueData = await prisma.campBookings.aggregate({
    where: { paymentStatus: "CLEARED" },
    _sum: { totalPrice: true },
  });
  const totalRevenue = revenueData._sum.totalPrice || 0;
  // Pending revenue (PENDING payments)
  const pendingRevenueData = await prisma.campBookings.aggregate({
    where: { paymentStatus: "PENDING" },
    _sum: { totalPrice: true },
  });
  const pendingRevenue = pendingRevenueData._sum.totalPrice || 0;
  // Total camps
  const totalCamps = await prisma.campSite.count();
  // Available camps
  const availableCamps = await prisma.campSite.count({
    where: { isAvailable: true },
  });
  // Total users
  const totalUsers = await prisma.user.count();
  // Recent bookings (last 10)
  const recentBookings = await prisma.campBookings.findMany({
    take: 10,
    orderBy: { id: "desc" },
    include: {
      campSite: {
        select: {
          name: true,
          slug: true,
        },
      },
      userInfo: {
        select: {
          fullName: true,
          email: true,
        },
      },
    },
  });
  // Monthly revenue (last 6 months)
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
    },
    revenue: {
      total: Number(totalRevenue),
      pending: Number(pendingRevenue),
      monthly: monthlyRevenue,
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