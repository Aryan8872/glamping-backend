/*
  Warnings:

  - Made the column `search_vector` on table `CampSite` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "idx_campsite_search_vector";

-- AlterTable
ALTER TABLE "CampSite" ALTER COLUMN "search_vector" SET NOT NULL;
