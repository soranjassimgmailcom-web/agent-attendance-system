ALTER TABLE "User"
ADD COLUMN "profileImage" BYTEA,
ADD COLUMN "profileImageType" TEXT;

CREATE TABLE "AgentActivity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentActivity_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AgentActivity_userId_date_idx" ON "AgentActivity"("userId", "date");
CREATE INDEX "AgentActivity_date_idx" ON "AgentActivity"("date");

ALTER TABLE "AgentActivity"
ADD CONSTRAINT "AgentActivity_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
