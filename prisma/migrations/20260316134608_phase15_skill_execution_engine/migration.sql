-- AlterTable
ALTER TABLE "WorkflowInstanceNode" ADD COLUMN "channelStyleApplied" TEXT;
ALTER TABLE "WorkflowInstanceNode" ADD COLUMN "channelType" TEXT;
ALTER TABLE "WorkflowInstanceNode" ADD COLUMN "selectedSkillIds" TEXT;
ALTER TABLE "WorkflowInstanceNode" ADD COLUMN "skillExecutionLog" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Skill" (
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
    "inputSchemaJson" TEXT,
    "outputSchemaJson" TEXT,
    "executionConfigJson" TEXT,
    "promptTemplate" TEXT,
    "requiredContextFields" TEXT,
    "estimatedDurationMs" INTEGER,
    "retryable" BOOLEAN NOT NULL DEFAULT true,
    "maxRetries" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL
);
INSERT INTO "new_Skill" ("category", "code", "createdAt", "description", "executionType", "id", "isSystemPreset", "name", "nameZh", "openClawSpecJson", "status", "updatedAt", "version") SELECT "category", "code", "createdAt", "description", "executionType", "id", "isSystemPreset", "name", "nameZh", "openClawSpecJson", "status", "updatedAt", "version" FROM "Skill";
DROP TABLE "Skill";
ALTER TABLE "new_Skill" RENAME TO "Skill";
CREATE UNIQUE INDEX "Skill_code_key" ON "Skill"("code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
