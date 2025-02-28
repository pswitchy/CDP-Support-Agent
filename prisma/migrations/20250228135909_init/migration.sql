-- CreateEnum
CREATE TYPE "CDP" AS ENUM ('SEGMENT', 'MPARTICLE', 'LYTICS', 'ZEOTAP');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ASSISTANT');

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "cdp" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "content" TEXT NOT NULL,
    "cdp" "CDP",
    "sessionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QueryAnalytics" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "cdp" "CDP",
    "sessionId" TEXT NOT NULL,
    "successful" BOOLEAN NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "response" TEXT,
    "duration" INTEGER NOT NULL,

    CONSTRAINT "QueryAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSession" (
    "id" TEXT NOT NULL,
    "lastSeen" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Document_url_key" ON "Document"("url");

-- CreateIndex
CREATE INDEX "Document_cdp_idx" ON "Document"("cdp");

-- CreateIndex
CREATE INDEX "Document_url_idx" ON "Document"("url");

-- CreateIndex
CREATE INDEX "Document_title_idx" ON "Document"("title");

-- CreateIndex
CREATE INDEX "ChatMessage_sessionId_idx" ON "ChatMessage"("sessionId");

-- CreateIndex
CREATE INDEX "QueryAnalytics_timestamp_idx" ON "QueryAnalytics"("timestamp");

-- CreateIndex
CREATE INDEX "QueryAnalytics_cdp_idx" ON "QueryAnalytics"("cdp");

-- CreateIndex
CREATE INDEX "UserSession_lastSeen_idx" ON "UserSession"("lastSeen");
