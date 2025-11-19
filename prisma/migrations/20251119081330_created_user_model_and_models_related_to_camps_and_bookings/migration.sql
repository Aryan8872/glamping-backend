-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('BOOKED', 'CANCELED');

-- CreateEnum
CREATE TYPE "BookingPaymentStatus" AS ENUM ('PENDING', 'CLEARED');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "fullName" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampSite" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "images" TEXT[],
    "pricePerNight" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampSite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampHost" (
    "id" SERIAL NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "profilePicture" TEXT NOT NULL,
    "campId" INTEGER NOT NULL,

    CONSTRAINT "CampHost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Facility" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Facility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampSiteFacility" (
    "id" SERIAL NOT NULL,
    "campId" INTEGER NOT NULL,
    "facilityId" INTEGER NOT NULL,

    CONSTRAINT "CampSiteFacility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampBookings" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "checkInDate" TIMESTAMP(3) NOT NULL,
    "checkOutDate" TIMESTAMP(3) NOT NULL,
    "totalPrice" DECIMAL(10,2) NOT NULL,
    "paymentStatus" "BookingPaymentStatus" NOT NULL,
    "campSiteId" INTEGER NOT NULL,
    "bookingStatus" "BookingStatus" NOT NULL DEFAULT 'BOOKED',

    CONSTRAINT "CampBookings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "CampSite_slug_key" ON "CampSite"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "CampHost_email_key" ON "CampHost"("email");

-- CreateIndex
CREATE UNIQUE INDEX "CampHost_campId_key" ON "CampHost"("campId");

-- CreateIndex
CREATE UNIQUE INDEX "Facility_slug_key" ON "Facility"("slug");

-- AddForeignKey
ALTER TABLE "CampHost" ADD CONSTRAINT "CampHost_campId_fkey" FOREIGN KEY ("campId") REFERENCES "CampSite"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampSiteFacility" ADD CONSTRAINT "CampSiteFacility_campId_fkey" FOREIGN KEY ("campId") REFERENCES "CampSite"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampSiteFacility" ADD CONSTRAINT "CampSiteFacility_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampBookings" ADD CONSTRAINT "CampBookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampBookings" ADD CONSTRAINT "CampBookings_campSiteId_fkey" FOREIGN KEY ("campSiteId") REFERENCES "CampSite"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
