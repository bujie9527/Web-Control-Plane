-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AgentTemplate" (
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
    "changeSummary" TEXT,
    "capabilityNotes" TEXT,
    "notes" TEXT,
    "manual" BOOLEAN NOT NULL DEFAULT true,
    "semi_auto" BOOLEAN NOT NULL DEFAULT true,
    "full_auto" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL
);
INSERT INTO "new_AgentTemplate" ("allowedExecutorTypes", "allowedTerminalTypes", "archetypeCode", "autoApproveWhenConfidenceGte", "category", "code", "createdAt", "defaultExecutorType", "defaultModelKey", "description", "disallowDirectTerminalAction", "domain", "fallbackModelKeys", "id", "instructionTemplate", "isCloneable", "isLatest", "isSystemPreset", "maxTokens", "name", "nameZh", "notes", "outputFormat", "parentTemplateId", "plannerDomain", "plannerTier", "requireGoalContext", "requireHumanReview", "requireIdentityContext", "requireNodeReview", "requireSOPContext", "requireStructuredOutput", "roleType", "sceneTags", "sourceTemplateId", "sourceVersion", "status", "supportedGoalTypeIds", "supportedProjectTypeIds", "supportedSkillIds", "systemPromptTemplate", "temperature", "updatedAt", "version") SELECT "allowedExecutorTypes", "allowedTerminalTypes", "archetypeCode", "autoApproveWhenConfidenceGte", "category", "code", "createdAt", "defaultExecutorType", "defaultModelKey", "description", "disallowDirectTerminalAction", "domain", "fallbackModelKeys", "id", "instructionTemplate", "isCloneable", "isLatest", "isSystemPreset", "maxTokens", "name", "nameZh", "notes", "outputFormat", "parentTemplateId", "plannerDomain", "plannerTier", "requireGoalContext", "requireHumanReview", "requireIdentityContext", "requireNodeReview", "requireSOPContext", "requireStructuredOutput", "roleType", "sceneTags", "sourceTemplateId", "sourceVersion", "status", "supportedGoalTypeIds", "supportedProjectTypeIds", "supportedSkillIds", "systemPromptTemplate", "temperature", "updatedAt", "version" FROM "AgentTemplate";
DROP TABLE "AgentTemplate";
ALTER TABLE "new_AgentTemplate" RENAME TO "AgentTemplate";
CREATE UNIQUE INDEX "AgentTemplate_code_key" ON "AgentTemplate"("code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
