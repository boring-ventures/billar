/*
  Warnings:

  - The values [CLEANING,MAINTENANCE,OFFICE,OTHER] on the enum `ItemType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."ItemType_new" AS ENUM ('SALE', 'INTERNAL_USE');
ALTER TABLE "public"."inventory_items" ALTER COLUMN "item_type" DROP DEFAULT;
ALTER TABLE "public"."inventory_items" ALTER COLUMN "item_type" TYPE "public"."ItemType_new" USING ("item_type"::text::"public"."ItemType_new");
ALTER TYPE "public"."ItemType" RENAME TO "ItemType_old";
ALTER TYPE "public"."ItemType_new" RENAME TO "ItemType";
DROP TYPE "public"."ItemType_old";
ALTER TABLE "public"."inventory_items" ALTER COLUMN "item_type" SET DEFAULT 'SALE';
COMMIT;
