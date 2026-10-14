CREATE TABLE "TeamMessage" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL DEFAULT '',
    "imageData" BYTEA,
    "imageType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TeamMessage_createdAt_idx"
ON "TeamMessage"("createdAt");

ALTER TABLE "TeamMessage"
ADD CONSTRAINT "TeamMessage_senderId_fkey"
FOREIGN KEY ("senderId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
