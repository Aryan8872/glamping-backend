-- DropForeignKey
ALTER TABLE "CampBookings" DROP CONSTRAINT "CampBookings_userId_fkey";

-- AlterTable
ALTER TABLE "CampBookings" ADD COLUMN     "adults" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "children" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "guestUserEmail" TEXT,
ADD COLUMN     "guestUserFullName" TEXT,
ADD COLUMN     "guestUserPhoneNumber" TEXT,
ADD COLUMN     "pets" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "CampSite" ADD COLUMN     "isAvailable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "maxAdult" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "maxChildren" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "maxPets" INTEGER NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE "CampBookings" ADD CONSTRAINT "CampBookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
