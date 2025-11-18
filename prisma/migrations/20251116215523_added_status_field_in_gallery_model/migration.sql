-- CreateEnum
CREATE TYPE "GalleryStatus" AS ENUM ('PUBLISHED', 'DRAFT', 'DELETED');

-- AlterTable
ALTER TABLE "Gallery" ADD COLUMN     "galleryStatus" "GalleryStatus" NOT NULL DEFAULT 'DRAFT';
