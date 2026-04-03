ALTER TABLE "OAuthConnection"
ADD COLUMN "displayName" TEXT,
ADD COLUMN "profileUrl" TEXT,
ADD COLUMN "scope" TEXT,
ADD COLUMN "lastError" TEXT,
ADD COLUMN "lastSyncedAt" TIMESTAMP(3);
