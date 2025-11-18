/*
  Warnings:

  - You are about to drop the column `coreValues` on the `AboutUs` table. All the data in the column will be lost.
  - You are about to drop the column `stats` on the `AboutUs` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AboutUs" DROP COLUMN "coreValues",
DROP COLUMN "stats";

-- CreateTable
CREATE TABLE "Stat" (
    "id" SERIAL NOT NULL,
    "value" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "heading" TEXT NOT NULL,
    "aboutUsId" INTEGER NOT NULL,

    CONSTRAINT "Stat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoreValue" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "aboutUsId" INTEGER NOT NULL,

    CONSTRAINT "CoreValue_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Stat" ADD CONSTRAINT "Stat_aboutUsId_fkey" FOREIGN KEY ("aboutUsId") REFERENCES "AboutUs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoreValue" ADD CONSTRAINT "CoreValue_aboutUsId_fkey" FOREIGN KEY ("aboutUsId") REFERENCES "AboutUs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
