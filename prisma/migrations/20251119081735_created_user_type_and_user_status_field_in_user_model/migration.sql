-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('ADMIN', 'USER', 'CAMPHOST', 'SUPERADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('DISABLED', 'ENABLED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "userStatus" "UserStatus" NOT NULL DEFAULT 'ENABLED',
ADD COLUMN     "userType" "UserType" NOT NULL DEFAULT 'USER';
