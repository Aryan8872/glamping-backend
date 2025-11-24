-- DropForeignKey
ALTER TABLE "CampSite" DROP CONSTRAINT "CampSite_hostId_fkey";

-- AlterTable
ALTER TABLE "CampSite" ALTER COLUMN "hostId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "CampSite" ADD CONSTRAINT "CampSite_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
