-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_WorkflowInstanceNode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "instanceId" TEXT NOT NULL,
    "templateNodeId" TEXT,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "createdAt" TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL,
    "resultSummary" TEXT,
    "workerOutputJson" TEXT,
    "errorSummary" TEXT,
    "reviewSummary" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "workerExecutionModel" TEXT,
    "workerExecutionDurationMs" INTEGER,
    "workerExecutionAgentId" TEXT,
    "selectedAgentTemplateId" TEXT,
    "recoveryStatus" TEXT,
    "lastRecoveryAction" TEXT,
    CONSTRAINT "WorkflowInstanceNode_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "WorkflowInstance" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_WorkflowInstanceNode" ("createdAt", "id", "instanceId", "key", "name", "orderIndex", "status", "templateNodeId", "updatedAt") SELECT "createdAt", "id", "instanceId", "key", "name", "orderIndex", "status", "templateNodeId", "updatedAt" FROM "WorkflowInstanceNode";
DROP TABLE "WorkflowInstanceNode";
ALTER TABLE "new_WorkflowInstanceNode" RENAME TO "WorkflowInstanceNode";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
