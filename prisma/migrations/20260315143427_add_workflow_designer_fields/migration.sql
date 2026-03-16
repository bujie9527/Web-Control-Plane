-- AlterTable
ALTER TABLE "WorkflowPlanningDraft" ADD COLUMN "canvasLayout" TEXT;
ALTER TABLE "WorkflowPlanningDraft" ADD COLUMN "changeSet" TEXT;
ALTER TABLE "WorkflowPlanningDraft" ADD COLUMN "graphVersion" INTEGER;
ALTER TABLE "WorkflowPlanningDraft" ADD COLUMN "validationSnapshot" TEXT;

-- AlterTable
ALTER TABLE "WorkflowPlanningSession" ADD COLUMN "capabilityPoolSnapshot" TEXT;
ALTER TABLE "WorkflowPlanningSession" ADD COLUMN "entryMode" TEXT;
ALTER TABLE "WorkflowPlanningSession" ADD COLUMN "sourceProjectId" TEXT;
ALTER TABLE "WorkflowPlanningSession" ADD COLUMN "sourceTemplateId" TEXT;

-- AlterTable
ALTER TABLE "WorkflowTemplateNode" ADD COLUMN "allowedAgentRoleTypes" TEXT;
ALTER TABLE "WorkflowTemplateNode" ADD COLUMN "bindingStatus" TEXT;
ALTER TABLE "WorkflowTemplateNode" ADD COLUMN "fallbackAgentTemplateIds" TEXT;
ALTER TABLE "WorkflowTemplateNode" ADD COLUMN "fallbackSkillIds" TEXT;
ALTER TABLE "WorkflowTemplateNode" ADD COLUMN "inputMapping" TEXT;
ALTER TABLE "WorkflowTemplateNode" ADD COLUMN "outputMapping" TEXT;
ALTER TABLE "WorkflowTemplateNode" ADD COLUMN "placeholderSpec" TEXT;
ALTER TABLE "WorkflowTemplateNode" ADD COLUMN "position" TEXT;
ALTER TABLE "WorkflowTemplateNode" ADD COLUMN "retryPolicy" TEXT;
ALTER TABLE "WorkflowTemplateNode" ADD COLUMN "reviewPolicy" TEXT;
ALTER TABLE "WorkflowTemplateNode" ADD COLUMN "supervisorPolicy" TEXT;
