-- AlterTable
ALTER TABLE "Terminal" ADD COLUMN "configJson" TEXT;
ALTER TABLE "Terminal" ADD COLUMN "credentialsJson" TEXT;
ALTER TABLE "Terminal" ADD COLUMN "lastTestMessage" TEXT;
ALTER TABLE "Terminal" ADD COLUMN "lastTestResult" TEXT;
ALTER TABLE "Terminal" ADD COLUMN "lastTestedAt" TEXT;
ALTER TABLE "Terminal" ADD COLUMN "linkedProjectIds" TEXT;
ALTER TABLE "Terminal" ADD COLUMN "notes" TEXT;
ALTER TABLE "Terminal" ADD COLUMN "typeCategory" TEXT;
