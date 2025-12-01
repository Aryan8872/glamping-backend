-- CreateTable
CREATE TABLE "Adventure" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "coverImage" TEXT NOT NULL,
    "bannerImage" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "pageDescription" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Adventure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampSiteAdventure" (
    "id" SERIAL NOT NULL,
    "campId" INTEGER NOT NULL,
    "adventureId" INTEGER NOT NULL,

    CONSTRAINT "CampSiteAdventure_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Adventure_name_key" ON "Adventure"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Adventure_slug_key" ON "Adventure"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "CampSiteAdventure_campId_adventureId_key" ON "CampSiteAdventure"("campId", "adventureId");

-- AddForeignKey
ALTER TABLE "CampSiteAdventure" ADD CONSTRAINT "CampSiteAdventure_campId_fkey" FOREIGN KEY ("campId") REFERENCES "CampSite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampSiteAdventure" ADD CONSTRAINT "CampSiteAdventure_adventureId_fkey" FOREIGN KEY ("adventureId") REFERENCES "Adventure"("id") ON DELETE CASCADE ON UPDATE CASCADE;
