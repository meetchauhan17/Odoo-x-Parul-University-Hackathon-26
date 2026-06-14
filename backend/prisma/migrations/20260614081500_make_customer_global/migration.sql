-- DropForeignKey
ALTER TABLE "Customer" DROP CONSTRAINT IF EXISTS "Customer_organizationId_fkey";

-- AlterTable
ALTER TABLE "Customer" DROP COLUMN IF EXISTS "organizationId";
