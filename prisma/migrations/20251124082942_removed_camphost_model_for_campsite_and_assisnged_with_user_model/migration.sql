/*
  Warnings:

  - You are about to drop the `CampHost` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[hostId]` on the table `CampSite` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `hostId` to the `CampSite` table without a default value. This is not possible if the table is not empty.
  - Added the required column `campSiteId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "CampHost" DROP CONSTRAINT "CampHost_campId_fkey";

-- AlterTable
ALTER TABLE "CampSite" ADD COLUMN     "hostId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "campSiteId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "CampHost";

-- CreateIndex
CREATE UNIQUE INDEX "CampSite_hostId_key" ON "CampSite"("hostId");

-- AddForeignKey
ALTER TABLE "CampSite" ADD CONSTRAINT "CampSite_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
