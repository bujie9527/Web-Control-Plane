-- AlterTable
ALTER TABLE "AgentTemplate" ADD COLUMN "channelStyleProfiles" TEXT;

-- CreateTable
CREATE TABLE "ProjectAgentConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "agentTemplateId" TEXT NOT NULL,
    "instructionOverride" TEXT,
    "channelStyleOverride" TEXT,
    "temperatureOverride" REAL,
    "maxTokensOverride" INTEGER,
    "modelConfigIdOverride" TEXT,
    "customParams" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectAgentConfig_projectId_agentTemplateId_key" ON "ProjectAgentConfig"("projectId", "agentTemplateId");
