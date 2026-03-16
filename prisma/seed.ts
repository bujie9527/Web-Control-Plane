/**
 * 数据库初始化种子脚本
 * 运行：npx prisma db seed 或 npm run db:seed
 */
import { PrismaClient } from '@prisma/client'
import * as crypto from 'crypto'

const prisma = new PrismaClient()

function now(): string {
  return new Date().toISOString().slice(0, 19).replace('T', ' ')
}

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

async function seedAdminUser(): Promise<void> {
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'admin123'
  const ts = now()
  await prisma.user.upsert({
    where: { account: 'admin@platform' },
    create: {
      account: 'admin@platform',
      passwordHash: hashPassword(adminPassword),
      name: '平台管理员',
      role: 'platform_admin',
      tenantId: null,
      isActive: true,
      createdAt: ts,
      updatedAt: ts,
    },
    update: { updatedAt: ts },
  })
}

/** 演示租户用户，与 mockUsers 中 user@tenant 对应，默认密码 tenant123 */
async function seedTenantDemoUser(): Promise<void> {
  const pwd = process.env.TENANT_DEMO_PASSWORD ?? 'tenant123'
  const ts = now()
  await prisma.user.upsert({
    where: { account: 'user@tenant' },
    create: {
      account: 'user@tenant',
      passwordHash: hashPassword(pwd),
      name: '租户用户',
      role: 'tenant_admin',
      tenantId: 'tenant-demo-001',
      isActive: true,
      createdAt: ts,
      updatedAt: ts,
    },
    update: { updatedAt: ts },
  })
}

/** 测试租户用户，与 mockUsers 中 zhangsan@t1 对应，默认密码 t1pass */
async function seedTenantT1User(): Promise<void> {
  const pwd = process.env.TENANT_T1_PASSWORD ?? 't1pass'
  const ts = now()
  await prisma.user.upsert({
    where: { account: 'zhangsan@t1' },
    create: {
      account: 'zhangsan@t1',
      passwordHash: hashPassword(pwd),
      name: '张三',
      role: 'tenant_admin',
      tenantId: 't1',
      isActive: true,
      createdAt: ts,
      updatedAt: ts,
    },
    update: { updatedAt: ts },
  })
}

async function main(): Promise<void> {
  await seedAdminUser()
  await seedTenantDemoUser()
  await seedTenantT1User()
  // eslint-disable-next-line no-console
  console.log('Seed 完成')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
