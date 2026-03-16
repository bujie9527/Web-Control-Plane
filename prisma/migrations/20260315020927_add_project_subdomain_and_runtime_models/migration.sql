-- AlterTable
ALTER TABLE "AgentTemplate" ADD COLUMN "platformType" TEXT;

-- CreateTable
CREATE TABLE "ProjectIdentityBinding" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "identityId" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "ProjectDeliverable" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "deliverableType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "frequency" TEXT,
    "target" TEXT,
    "notes" TEXT,
    "createdAt" TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "ProjectResourceConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "configType" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "WorkflowRuntimeLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "instanceId" TEXT NOT NULL,
    "nodeId" TEXT,
    "eventType" TEXT NOT NULL,
    "messageZh" TEXT NOT NULL,
    "operatorId" TEXT,
    "meta" TEXT,
    "createdAt" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "WorkflowSupervisorDecision" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "instanceId" TEXT NOT NULL,
    "nodeId" TEXT,
    "decisionType" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "suggestedNextAction" TEXT,
    "relatedErrorSummary" TEXT,
    "status" TEXT NOT NULL DEFAULT 'suggested',
    "appliedBy" TEXT,
    "appliedAt" TEXT,
    "createdAt" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "WorkflowPublishRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateId" TEXT NOT NULL,
    "planningSessionId" TEXT,
    "planningDraftId" TEXT,
    "draftVersion" INTEGER,
    "publishedBy" TEXT NOT NULL,
    "publishedAt" TEXT NOT NULL,
    "notes" TEXT
);
