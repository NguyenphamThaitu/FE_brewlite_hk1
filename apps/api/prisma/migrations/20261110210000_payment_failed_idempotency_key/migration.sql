-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'PAYMENT_FAILED';

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "idempotencyKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Payment_idempotencyKey_key" ON "Payment"("idempotencyKey");

