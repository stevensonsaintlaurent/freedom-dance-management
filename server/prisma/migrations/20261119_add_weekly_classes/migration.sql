
-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM (
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY'
);

-- CreateTable
CREATE TABLE "WeeklyClass" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "level" "ClassLevel" NOT NULL DEFAULT 'BEGINNER',
  "dayOfWeek" "DayOfWeek" NOT NULL,
  "startTimeMinutes" INTEGER NOT NULL,
  "durationMinutes" INTEGER NOT NULL,
  "capacity" INTEGER NOT NULL DEFAULT 20,
  "priceCents" INTEGER NOT NULL DEFAULT 1500,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "instructorId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "WeeklyClass_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WeeklyClass_dayOfWeek_startTimeMinutes_idx"
ON "WeeklyClass"("dayOfWeek", "startTimeMinutes");

-- CreateIndex
CREATE INDEX "WeeklyClass_instructorId_idx"
ON "WeeklyClass"("instructorId");

-- AddForeignKey
ALTER TABLE "WeeklyClass"
ADD CONSTRAINT "WeeklyClass_instructorId_fkey"
FOREIGN KEY ("instructorId")
REFERENCES "User"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;
