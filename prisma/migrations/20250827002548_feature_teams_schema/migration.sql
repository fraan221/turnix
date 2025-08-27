/*
  Warnings:

  - You are about to drop the column `barbershopId` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[connectionCode]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_barbershopId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "barbershopId",
ADD COLUMN     "connectionCode" TEXT;

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "barbershopId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Team_userId_key" ON "Team"("userId");

-- CreateIndex
CREATE INDEX "Team_barbershopId_idx" ON "Team"("barbershopId");

-- CreateIndex
CREATE UNIQUE INDEX "User_connectionCode_key" ON "User"("connectionCode");

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_barbershopId_fkey" FOREIGN KEY ("barbershopId") REFERENCES "Barbershop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
