-- CreateTable
CREATE TABLE "SystemTerminalType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "nameZh" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "typeCategory" TEXT NOT NULL,
    "icon" TEXT,
    "description" TEXT,
    "authSchema" TEXT,
    "configSchema" TEXT,
    "supportedProjectTypeIds" TEXT,
    "capabilityTags" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "isSystemPreset" BOOLEAN NOT NULL DEFAULT true,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "createdAt" TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "SystemTerminalType_code_key" ON "SystemTerminalType"("code");
