-- CreateEnum
CREATE TYPE "ClassLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'OPEN_LEVEL');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('CONFIRMED', 'CANCELLED');

-- CreateTable
CREATE TABLE "DanceClass" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "level" "ClassLevel" NOT NULL DEFAULT 'BEGINNER',
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 20,
    "priceCents" INTEGER NOT NULL DEFAULT 1500,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "instructorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DanceClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "danceClassId" TEXT NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'CONFIRMED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DanceClass_instructorId_idx" ON "DanceClass"("instructorId");

-- CreateIndex
CREATE INDEX "DanceClass_startsAt_idx" ON "DanceClass"("startsAt");

-- CreateIndex
CREATE INDEX "Booking_danceClassId_status_idx" ON "Booking"("danceClassId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_userId_danceClassId_key" ON "Booking"("userId", "danceClassId");

-- AddForeignKey
ALTER TABLE "DanceClass" ADD CONSTRAINT "DanceClass_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_danceClassId_fkey" FOREIGN KEY ("danceClassId") REFERENCES "DanceClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
