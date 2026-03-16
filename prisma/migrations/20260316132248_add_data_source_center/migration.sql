-- CreateTable
CREATE TABLE "DataSourceCredential" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "nameZh" TEXT,
    "providerType" TEXT NOT NULL,
    "encryptedSecret" TEXT NOT NULL,
    "secretMasked" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "createdAt" TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "DataSourceProvider" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "nameZh" TEXT,
    "providerType" TEXT NOT NULL,
    "baseUrl" TEXT,
    "credentialId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "isSystemPreset" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "DataSourceConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "providerId" TEXT NOT NULL,
    "tenantId" TEXT,
    "configJson" TEXT,
    "rateLimitJson" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "createdAt" TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL
);
