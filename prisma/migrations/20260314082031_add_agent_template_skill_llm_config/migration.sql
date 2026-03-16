-- CreateTable
CREATE TABLE "AgentTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "nameZh" TEXT,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "roleType" TEXT NOT NULL,
    "category" TEXT,
    "domain" TEXT,
    "sceneTags" TEXT,
    "archetypeCode" TEXT,
    "parentTemplateId" TEXT,
    "sourceTemplateId" TEXT,
    "sourceVersion" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "version" INTEGER NOT NULL DEFAULT 1,
    "isLatest" BOOLEAN NOT NULL DEFAULT true,
    "isSystemPreset" BOOLEAN NOT NULL DEFAULT false,
    "isCloneable" BOOLEAN NOT NULL DEFAULT true,
    "supportedProjectTypeIds" TEXT,
    "supportedGoalTypeIds" TEXT,
    "supportedSkillIds" TEXT,
    "defaultExecutorType" TEXT NOT NULL DEFAULT 'agent',
    "allowedExecutorTypes" TEXT,
    "allowedTerminalTypes" TEXT,
    "defaultModelKey" TEXT,
    "fallbackModelKeys" TEXT,
    "temperature" REAL,
    "maxTokens" INTEGER,
    "systemPromptTemplate" TEXT,
    "instructionTemplate" TEXT,
    "outputFormat" TEXT,
    "requireGoalContext" BOOLEAN NOT NULL DEFAULT false,
    "requireIdentityContext" BOOLEAN NOT NULL DEFAULT false,
    "requireSOPContext" BOOLEAN NOT NULL DEFAULT false,
    "requireStructuredOutput" BOOLEAN NOT NULL DEFAULT false,
    "disallowDirectTerminalAction" BOOLEAN NOT NULL DEFAULT true,
    "requireHumanReview" BOOLEAN NOT NULL DEFAULT false,
    "requireNodeReview" BOOLEAN NOT NULL DEFAULT false,
    "autoApproveWhenConfidenceGte" REAL,
    "plannerDomain" TEXT,
    "plannerTier" TEXT,
    "notes" TEXT,
    "createdAt" TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "nameZh" TEXT,
    "code" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "executionType" TEXT NOT NULL,
    "description" TEXT,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "status" TEXT NOT NULL DEFAULT 'active',
    "isSystemPreset" BOOLEAN NOT NULL DEFAULT false,
    "openClawSpecJson" TEXT,
    "createdAt" TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "LLMProvider" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "nameZh" TEXT,
    "providerType" TEXT NOT NULL,
    "baseUrl" TEXT,
    "credentialId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "createdAt" TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "LLMModelConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "nameZh" TEXT,
    "providerId" TEXT NOT NULL,
    "modelKey" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "temperature" REAL NOT NULL DEFAULT 0.7,
    "maxTokens" INTEGER NOT NULL DEFAULT 2048,
    "timeoutMs" INTEGER NOT NULL DEFAULT 30000,
    "retryCount" INTEGER NOT NULL DEFAULT 1,
    "structuredOutputMode" TEXT NOT NULL DEFAULT 'json_object',
    "fallbackModelConfigId" TEXT,
    "supportedAgentCategories" TEXT,
    "notes" TEXT,
    "createdAt" TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL,
    CONSTRAINT "LLMModelConfig_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "LLMProvider" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AgentLLMBinding" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentTemplateId" TEXT NOT NULL,
    "modelConfigId" TEXT NOT NULL,
    "bindingType" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL,
    CONSTRAINT "AgentLLMBinding_modelConfigId_fkey" FOREIGN KEY ("modelConfigId") REFERENCES "LLMModelConfig" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "AgentTemplate_code_key" ON "AgentTemplate"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_code_key" ON "Skill"("code");
