-- CreateEnum
CREATE TYPE "StockStatus" AS ENUM ('IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', 'SEASONAL');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "stockStatus" "StockStatus" NOT NULL DEFAULT 'IN_STOCK',
ADD COLUMN     "seasonalMessage" TEXT;
