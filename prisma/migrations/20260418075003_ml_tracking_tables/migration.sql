/*
  Warnings:

  - Made the column `co_occurrence_count` on table `product_associations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `confidence` on table `product_associations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `lift` on table `product_associations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `last_computed` on table `product_associations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `product_id` on table `recommendation_events` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "product_associations" DROP CONSTRAINT "product_associations_product_a_fkey";

-- DropForeignKey
ALTER TABLE "product_associations" DROP CONSTRAINT "product_associations_product_b_fkey";

-- DropForeignKey
ALTER TABLE "recommendation_events" DROP CONSTRAINT "recommendation_events_dealer_id_fkey";

-- DropForeignKey
ALTER TABLE "recommendation_events" DROP CONSTRAINT "recommendation_events_product_id_fkey";

-- DropForeignKey
ALTER TABLE "recommendation_events" DROP CONSTRAINT "recommendation_events_user_id_fkey";

-- DropIndex
DROP INDEX "idx_assoc_lift";

-- AlterTable
ALTER TABLE "product_associations" ALTER COLUMN "co_occurrence_count" SET NOT NULL,
ALTER COLUMN "confidence" SET NOT NULL,
ALTER COLUMN "lift" SET NOT NULL,
ALTER COLUMN "last_computed" SET NOT NULL,
ALTER COLUMN "last_computed" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "recommendation_events" ALTER COLUMN "product_id" SET NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "recommendation_events" ADD CONSTRAINT "recommendation_events_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "idx_assoc_product_a" RENAME TO "product_associations_product_a_idx";

-- RenameIndex
ALTER INDEX "idx_rec_events_created" RENAME TO "recommendation_events_created_at_idx";

-- RenameIndex
ALTER INDEX "idx_rec_events_product" RENAME TO "recommendation_events_product_id_idx";

-- RenameIndex
ALTER INDEX "idx_rec_events_session" RENAME TO "recommendation_events_session_id_idx";

-- RenameIndex
ALTER INDEX "idx_rec_events_type" RENAME TO "recommendation_events_event_type_idx";

-- RenameIndex
ALTER INDEX "idx_rec_events_user" RENAME TO "recommendation_events_user_id_idx";
