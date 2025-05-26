-- CreateEnum
CREATE TYPE "public"."ItemType" AS ENUM ('SALE', 'CLEANING', 'MAINTENANCE', 'OFFICE', 'OTHER');

-- AlterTable
ALTER TABLE "public"."inventory_items" ADD COLUMN     "item_type" "public"."ItemType" NOT NULL DEFAULT 'SALE';
