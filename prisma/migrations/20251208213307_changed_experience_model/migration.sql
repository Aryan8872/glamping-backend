/*
  Warnings:

  - You are about to drop the column `icon` on the `Experience` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Experience" DROP COLUMN "icon",
ADD COLUMN     "imageUrl" TEXT;
