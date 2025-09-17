-- AlterTable
ALTER TABLE "WorkingHours" ALTER COLUMN "startTime" DROP NOT NULL,
ALTER COLUMN "endTime" DROP NOT NULL;

-- CreateTable
CREATE TABLE "WorkScheduleBlock" (
    "id" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "workingHoursId" TEXT NOT NULL,

    CONSTRAINT "WorkScheduleBlock_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "WorkScheduleBlock" ADD CONSTRAINT "WorkScheduleBlock_workingHoursId_fkey" FOREIGN KEY ("workingHoursId") REFERENCES "WorkingHours"("id") ON DELETE CASCADE ON UPDATE CASCADE;
