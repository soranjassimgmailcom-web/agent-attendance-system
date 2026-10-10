CREATE TYPE "LeaveType" AS ENUM ('VACATION', 'AUTHORIZED_ABSENCE');

ALTER TABLE "User"
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE "LeaveDay" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "type" "LeaveType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaveDay_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LeaveDay_userId_date_key" ON "LeaveDay"("userId", "date");
CREATE INDEX "LeaveDay_date_idx" ON "LeaveDay"("date");

ALTER TABLE "LeaveDay"
ADD CONSTRAINT "LeaveDay_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
