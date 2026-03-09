/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `dealers` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "dealers" ADD COLUMN     "password_hash" VARCHAR(255);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "is_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "otp" VARCHAR(6),
ADD COLUMN     "otp_expiry" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "dealers_email_key" ON "dealers"("email");
