/*
  Warnings:

  - A unique constraint covering the columns `[workingHoursId,type]` on the table `WorkScheduleBlock` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "WorkShiftType" AS ENUM ('MORNING', 'AFTERNOON', 'NIGHT');

-- AlterTable
ALTER TABLE "WorkScheduleBlock" ADD COLUMN     "type" "WorkShiftType" NOT NULL DEFAULT 'MORNING';

-- CreateIndex
CREATE UNIQUE INDEX "WorkScheduleBlock_workingHoursId_type_key" ON "WorkScheduleBlock"("workingHoursId", "type");
