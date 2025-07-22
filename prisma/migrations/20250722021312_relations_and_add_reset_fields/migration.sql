/*
  Warnings:

  - You are about to drop the column `createdAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `User` table. All the data in the column will be lost.
  - Made the column `barbershopId` on table `Booking` required. This step will fail if there are existing NULL values in that column.
  - Made the column `barbershopId` on table `Client` required. This step will fail if there are existing NULL values in that column.
  - Made the column `barbershopId` on table `Service` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Booking" ALTER COLUMN "barbershopId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Client" ALTER COLUMN "barbershopId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Service" ALTER COLUMN "barbershopId" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt";
