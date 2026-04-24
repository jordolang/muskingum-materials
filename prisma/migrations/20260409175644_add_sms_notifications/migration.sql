-- AlterTable
ALTER TABLE "Order" ADD COLUMN "smsOptIn" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "UserProfile" ADD COLUMN "smsOptIn" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "SmsNotification" (
    "id" TEXT NOT NULL,
    "orderId" TEXT,
    "type" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "providerId" TEXT,
    "errorMsg" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SmsNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SmsNotification_orderId_idx" ON "SmsNotification"("orderId");

-- CreateIndex
CREATE INDEX "SmsNotification_status_idx" ON "SmsNotification"("status");

-- CreateIndex
CREATE INDEX "SmsNotification_phone_idx" ON "SmsNotification"("phone");

-- AddForeignKey
ALTER TABLE "SmsNotification" ADD CONSTRAINT "SmsNotification_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
