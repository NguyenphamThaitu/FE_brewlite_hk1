-- Thanh toán mô phỏng: số dư ví của người dùng và 4 số cuối thẻ trên giao dịch
ALTER TABLE "User" ADD COLUMN "walletBalance" INTEGER NOT NULL DEFAULT 200000;
ALTER TABLE "Payment" ADD COLUMN "cardLast4" TEXT;
