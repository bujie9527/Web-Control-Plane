-- CreateTable
CREATE TABLE "WorkflowPlanningSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scopeType" TEXT NOT NULL,
    "tenantId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "projectTypeId" TEXT NOT NULL,
    "goalTypeId" TEXT NOT NULL,
    "deliverableMode" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceText" TEXT,
    "plannerAgentTemplateId" TEXT,
    "plannerExecutionBackend" TEXT NOT NULL,
    "currentDraftId" TEXT,
    "status" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "WorkflowPlanningDraft" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "summary" TEXT,
    "parsedSOP" TEXT,
    "nodes" TEXT NOT NULL,
    "suggestedAgentTemplateIds" TEXT,
    "suggestedSkillIds" TEXT,
    "changeSummary" TEXT,
    "riskNotes" TEXT,
    "missingCapabilities" TEXT,
    "capabilityNotes" TEXT,
    "status" TEXT NOT NULL,
    "createdAt" TEXT NOT NULL,
    CONSTRAINT "WorkflowPlanningDraft_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "WorkflowPlanningSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkflowPlanningMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "relatedDraftVersion" INTEGER,
    "messageType" TEXT NOT NULL,
    "createdAt" TEXT NOT NULL,
    CONSTRAINT "WorkflowPlanningMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "WorkflowPlanningSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "projectTypeCode" TEXT,
    "goalSummary" TEXT,
    "kpiSummary" TEXT,
    "allowedAgentTemplateIds" TEXT,
    "preferredAgentTemplateIds" TEXT,
    "defaultPlannerAgentTemplateId" TEXT,
    "defaultSupervisorAgentTemplateId" TEXT,
    "selectedWorkflowTemplateId" TEXT,
    "createdAt" TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "ProjectGoal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "goalType" TEXT NOT NULL,
    "goalName" TEXT NOT NULL,
    "goalDescription" TEXT NOT NULL,
    "successCriteria" TEXT,
    "kpiDefinition" TEXT,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "goalTypeCode" TEXT,
    "primaryMetricCode" TEXT,
    "secondaryMetricCodes" TEXT,
    "createdAt" TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL,
    CONSTRAINT "ProjectGoal_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectSOP" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "sopRaw" TEXT NOT NULL,
    "sopParsed" TEXT,
    "status" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "createdAt" TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL,
    CONSTRAINT "ProjectSOP_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Identity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "corePositioning" TEXT,
    "toneStyle" TEXT,
    "contentDirections" TEXT,
    "behaviorRules" TEXT,
    "platformAdaptations" TEXT,
    "status" TEXT NOT NULL,
    "createdAt" TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Terminal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "identityId" TEXT,
    "status" TEXT NOT NULL,
    "createdAt" TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "WorkflowTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scopeType" TEXT NOT NULL,
    "tenantId" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "status" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "nodeCount" INTEGER NOT NULL DEFAULT 0,
    "supportedProjectTypeId" TEXT,
    "supportedGoalTypeIds" TEXT,
    "supportedDeliverableModes" TEXT,
    "createdAt" TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "WorkflowTemplateNode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workflowTemplateId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "executionType" TEXT NOT NULL,
    "intentType" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "dependsOnNodeIds" TEXT,
    "recommendedAgentTemplateId" TEXT,
    "allowedSkillIds" TEXT,
    "createdAt" TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL,
    CONSTRAINT "WorkflowTemplateNode_workflowTemplateId_fkey" FOREIGN KEY ("workflowTemplateId") REFERENCES "WorkflowTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkflowInstance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "workflowTemplateId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "WorkflowInstanceNode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "instanceId" TEXT NOT NULL,
    "templateNodeId" TEXT,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "createdAt" TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL,
    CONSTRAINT "WorkflowInstanceNode_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "WorkflowInstance" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "workflowInstanceId" TEXT,
    "workflowInstanceNodeId" TEXT,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "status" TEXT NOT NULL,
    "createdAt" TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL
);
