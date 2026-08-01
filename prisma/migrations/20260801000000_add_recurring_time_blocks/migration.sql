-- AlterTable
ALTER TABLE "TimeBlock" ALTER COLUMN "startTime" DROP NOT NULL,
ALTER COLUMN "endTime" DROP NOT NULL;

-- AlterTable
ALTER TABLE "TimeBlock" ADD COLUMN     "dayOfWeek" INTEGER,
ADD COLUMN     "endTimeOfDay" TEXT,
ADD COLUMN     "recurrenceEndDate" TIMESTAMP(3),
ADD COLUMN     "startTimeOfDay" TEXT;

-- CreateIndex
CREATE INDEX "TimeBlock_barberId_dayOfWeek_idx" ON "TimeBlock"("barberId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "TimeBlock_barberId_startTime_endTime_idx" ON "TimeBlock"("barberId", "startTime", "endTime");
