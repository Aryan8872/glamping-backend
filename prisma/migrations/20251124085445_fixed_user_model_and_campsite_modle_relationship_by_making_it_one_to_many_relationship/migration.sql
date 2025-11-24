/*
  Warnings:

  - You are about to drop the column `campSiteId` on the `User` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "CampSite_hostId_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "campSiteId";
