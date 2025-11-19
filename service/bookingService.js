import prisma from "../utils/prismaClient.js";
import { GalleryStatus } from "../utils/types.js";

export const createBookingService = async (data) => {
  return prisma.campBookings.create({
    data: {
      userInfo: {
        connect: { id: data.userId },
      },
      checkInDate: new Date(data.checkInDate),
      checkOutDate: new Date(data.checkOutDate),
      totalPrice: data.totalPrice,
      campSite: {
        connect: { id: data.campSiteId },
      },
    },
  });
};

export const updateBookingStatusService = async (id, status) => {
  const updatedBooking = await prisma.campBookings.update({
    where: { id },
    data: { bookingStatus: status },
    include: {
      campSite: true,
      userInfo: true,
    },
  });
  return updatedBooking;
};
export const getAllBookingService = async () => {
  const campBookings = await prisma.campBookings.findMany({
    select: {
      id: true,
      bookingStatus: true,
      campSite: true,
      checkInDate: true,
      checkOutDate: true,
      totalPrice: true,
      userInfo: true,
      paymentStatus: true,
    },
  });
  return campBookings;
};

export const getCampBookingsByIdService = async (id) => {
  const campBooking = await prisma.campBookings.findUnique({ where: { id } });
  return campBooking;
};

export const getCampBookingsByUserIdService = async (id) => {
  const campBooking = await prisma.campBookings.findUnique({
    where: { userId: id },
  });
  return campBooking;
};
