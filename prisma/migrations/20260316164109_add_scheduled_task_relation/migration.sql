-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "terminalId" TEXT,
    "channelType" TEXT NOT NULL,
    "externalChatId" TEXT NOT NULL,
    "title" TEXT,
    "latestMessageAt" TEXT,
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "IncomingMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "terminalId" TEXT,
    "conversationId" TEXT,
    "channelType" TEXT NOT NULL,
    "externalMessageId" TEXT,
    "senderExternalId" TEXT,
    "senderName" TEXT,
    "messageType" TEXT NOT NULL,
    "contentText" TEXT,
    "payloadJson" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "routeTarget" TEXT,
    "processedAt" TEXT,
    "createdAt" TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "OutgoingMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "terminalId" TEXT,
    "conversationId" TEXT,
    "channelType" TEXT NOT NULL,
    "targetExternalChatId" TEXT,
    "contentText" TEXT,
    "payloadJson" TEXT,
    "sourceType" TEXT NOT NULL,
    "sourceRefId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "externalMessageId" TEXT,
    "errorMessage" TEXT,
    "sentAt" TEXT,
    "createdAt" TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "ScheduledTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "cronExpr" TEXT,
    "runAt" TEXT,
    "timezone" TEXT,
    "targetType" TEXT NOT NULL,
    "targetRefId" TEXT,
    "payloadJson" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "lastRunAt" TEXT,
    "nextRunAt" TEXT,
    "failCount" INTEGER NOT NULL DEFAULT 0,
    "maxFailCount" INTEGER NOT NULL DEFAULT 3,
    "createdAt" TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "ScheduledTaskExecution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TEXT NOT NULL,
    "finishedAt" TEXT,
    "triggerSource" TEXT NOT NULL,
    "resultSummary" TEXT,
    "errorSummary" TEXT,
    "createdAt" TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL,
    CONSTRAINT "ScheduledTaskExecution_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "ScheduledTask" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "periodType" TEXT NOT NULL,
    "periodStart" TEXT NOT NULL,
    "periodEnd" TEXT NOT NULL,
    "summaryJson" TEXT,
    "kpiJson" TEXT,
    "generatedBy" TEXT,
    "generatedAt" TEXT NOT NULL,
    "createdAt" TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_tenantId_channelType_externalChatId_key" ON "Conversation"("tenantId", "channelType", "externalChatId");
