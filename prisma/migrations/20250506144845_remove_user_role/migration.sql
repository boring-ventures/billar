/*
  Warnings:

  - The values [USER] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."UserRole_new" AS ENUM ('SELLER', 'ADMIN', 'SUPERADMIN');
ALTER TABLE "public"."profiles" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "public"."profiles" ALTER COLUMN "role" TYPE "public"."UserRole_new" USING ("role"::text::"public"."UserRole_new");
ALTER TYPE "public"."UserRole" RENAME TO "UserRole_old";
ALTER TYPE "public"."UserRole_new" RENAME TO "UserRole";
DROP TYPE "public"."UserRole_old";
ALTER TABLE "public"."profiles" ALTER COLUMN "role" SET DEFAULT 'SELLER';
COMMIT;

-- AlterTable
ALTER TABLE "public"."profiles" ALTER COLUMN "role" SET DEFAULT 'SELLER';
