-- CreateEnum
CREATE TYPE "DeliverySpeed" AS ENUM ('STANDARD', 'RAPID');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "deliverySpeed" "DeliverySpeed" NOT NULL DEFAULT 'STANDARD';
