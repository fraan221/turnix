-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "description" TEXT,
ALTER COLUMN "durationInMinutes" DROP NOT NULL;
