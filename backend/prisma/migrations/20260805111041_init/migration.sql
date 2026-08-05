/*
  Warnings:

  - You are about to drop the column `parentId` on the `Category` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "BannerType" AS ENUM ('HERO', 'PROMOTIONAL', 'SIDEBAR');

-- CreateEnum
CREATE TYPE "FeaturedSection" AS ENUM ('BEST_SELLERS', 'NEW_ARRIVALS', 'SALE');

-- DropForeignKey
ALTER TABLE "Category" DROP CONSTRAINT "Category_parentId_fkey";

-- DropIndex
DROP INDEX "Category_parentId_idx";

-- AlterTable
ALTER TABLE "Category" DROP COLUMN "parentId";

-- CreateTable
CREATE TABLE "Banner" (
    "id" TEXT NOT NULL,
    "type" "BannerType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT NOT NULL,
    "mobileImageUrl" TEXT,
    "linkUrl" TEXT,
    "linkText" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeaturedProduct" (
    "id" TEXT NOT NULL,
    "section" "FeaturedSection" NOT NULL,
    "productId" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeaturedProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Banner_displayOrder_idx" ON "Banner"("displayOrder");

-- CreateIndex
CREATE INDEX "Banner_type_isActive_idx" ON "Banner"("type", "isActive");

-- CreateIndex
CREATE INDEX "FeaturedProduct_displayOrder_idx" ON "FeaturedProduct"("displayOrder");

-- CreateIndex
CREATE INDEX "FeaturedProduct_section_isActive_idx" ON "FeaturedProduct"("section", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "FeaturedProduct_section_productId_displayOrder_key" ON "FeaturedProduct"("section", "productId", "displayOrder");

-- AddForeignKey
ALTER TABLE "FeaturedProduct" ADD CONSTRAINT "FeaturedProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
