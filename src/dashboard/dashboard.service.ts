import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardData() {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalCampsites,
      totalAdventures,
      totalDestinations,
      totalExperiences,
      monthlyBookings,
      monthlyRevenueData,
      recentBookings,
      recentUsers,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.campSite.count(),
      this.prisma.adventure.count(),
      this.prisma.destination.count(),
      this.prisma.experience.count(),
      this.prisma.campBookings.count({
        where: { createdAt: { gte: startOfMonth } },
      }),
      this.prisma.campBookings.aggregate({
        where: { createdAt: { gte: startOfMonth }, bookingStatus: 'BOOKED' },
        _sum: { totalPrice: true },
      }),
      this.prisma.campBookings.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          campSite: { select: { name: true } },
          userInfo: { select: { fullName: true } },
        },
      }),
      this.prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, fullName: true, email: true, createdAt: true, userType: true },
      }),
    ]);

    return {
      stats: {
        totalUsers,
        totalCampsites,
        totalAdventures,
        totalDestinations,
        totalExperiences,
        monthlyBookings,
        monthlyRevenue: monthlyRevenueData._sum.totalPrice || 0,
      },
      recentBookings,
      recentUsers,
    };
  }

  async getDashboardStats() {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    const [
      totalBookings,
      currentMonthBookings,
      prevMonthBookings,
      activeBookings,
      completedBookings,
      canceledBookings,
      totalRevenueAgg,
      currentMonthRevenueAgg,
      prevMonthRevenueAgg,
      pendingRevenueAgg,
      totalCamps,
      availableCamps,
      totalUsers,
      recentBookings,
      monthlyRevenue,
    ] = await Promise.all([
      this.prisma.campBookings.count(),
      this.prisma.campBookings.count({
        where: { checkInDate: { gte: currentMonthStart, lt: nextMonthStart } },
      }),
      this.prisma.campBookings.count({
        where: { checkInDate: { gte: prevMonthStart, lt: currentMonthStart } },
      }),
      this.prisma.campBookings.count({ where: { bookingStatus: 'BOOKED' } }),
      this.prisma.campBookings.count({
        where: { bookingStatus: 'BOOKED', checkOutDate: { lt: now } },
      }),
      this.prisma.campBookings.count({ where: { bookingStatus: 'CANCELED' } }),
      this.prisma.campBookings.aggregate({
        where: { paymentStatus: 'CLEARED' },
        _sum: { totalPrice: true },
      }),
      this.prisma.campBookings.aggregate({
        where: {
          paymentStatus: 'CLEARED',
          checkInDate: { gte: currentMonthStart, lt: nextMonthStart },
        },
        _sum: { totalPrice: true },
      }),
      this.prisma.campBookings.aggregate({
        where: {
          paymentStatus: 'CLEARED',
          checkInDate: { gte: prevMonthStart, lt: currentMonthStart },
        },
        _sum: { totalPrice: true },
      }),
      this.prisma.campBookings.aggregate({
        where: { paymentStatus: 'PENDING' },
        _sum: { totalPrice: true },
      }),
      this.prisma.campSite.count(),
      this.prisma.campSite.count({ where: { isAvailable: true } }),
      this.prisma.user.count(),
      this.prisma.campBookings.findMany({
        take: 10,
        orderBy: { id: 'desc' },
        include: {
          campSite: { select: { name: true, slug: true } },
          userInfo: { select: { fullName: true, email: true } },
        },
      }),
      this.prisma.$queryRawUnsafe(`
        SELECT 
          TO_CHAR("checkInDate", 'YYYY-MM') as month,
          SUM("totalPrice")::float as revenue
        FROM "CampBookings"
        WHERE "paymentStatus" = 'CLEARED'
          AND "checkInDate" >= $1
        GROUP BY TO_CHAR("checkInDate", 'YYYY-MM')
        ORDER BY month ASC
      `, sixMonthsAgo) as Promise<any[]>,
    ]);

    const totalRevenue = Number(totalRevenueAgg._sum.totalPrice || 0);
    const currentMonthRevenue = Number(currentMonthRevenueAgg._sum.totalPrice || 0);
    const prevMonthRevenue = Number(prevMonthRevenueAgg._sum.totalPrice || 0);
    const pendingRevenue = Number(pendingRevenueAgg._sum.totalPrice || 0);

    const bookingsChange = calculateChange(currentMonthBookings, prevMonthBookings);
    const revenueChange = calculateChange(currentMonthRevenue, prevMonthRevenue);

    return {
      bookings: {
        total: totalBookings,
        active: activeBookings,
        completed: completedBookings,
        canceled: canceledBookings,
        change: bookingsChange,
      },
      revenue: {
        total: totalRevenue,
        pending: pendingRevenue,
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
  }
}

