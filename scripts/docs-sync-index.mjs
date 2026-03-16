#!/usr/bin/env node
/**
 * docs:index — 同步更新代码结构索引
 *
 * 用法：npm run docs:index
 *
 * 功能：
 *   1. 扫描关键目录，统计文件数量
 *   2. 更新 docs/status/codebase-index.md 中的统计数字与"最近更新"日期
 *   3. 更新 scripts/ 目录的文件清单（自动列出所有脚本文件）
 *   4. 不改变文档描述性文字，只更新可从文件系统直接读取的客观数据
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const INDEX_PATH = path.join(ROOT, 'docs', 'status', 'codebase-index.md')

// ─── 工具：递归计数特定扩展名的文件 ────────────────────────────────────────────
function countFiles(dir, extensions = ['.ts', '.tsx'], excludeDirs = ['node_modules', 'dist', '.git']) {
  let count = 0
  if (!fs.existsSync(dir)) return count
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (excludeDirs.includes(entry.name)) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      count += countFiles(full, extensions, excludeDirs)
    } else if (extensions.some(ext => entry.name.endsWith(ext))) {
      count++
    }
  }
  return count
}

// ─── 工具：列出目录下的直接子目录 ──────────────────────────────────────────────
function listSubdirs(dir) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name)
    .sort()
}

// ─── 工具：列出目录下的直接文件（带可选扩展名过滤） ────────────────────────────
function listFiles(dir, exts = null) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter(e => e.isFile() && (exts === null || exts.some(ext => e.name.endsWith(ext))))
    .map(e => e.name)
    .sort()
}

// ─── 统计数据收集 ───────────────────────────────────────────────────────────────
function collectStats() {
  const srcModules = path.join(ROOT, 'src', 'modules')
  const serverDomain = path.join(ROOT, 'server', 'domain')
  const serverLlm = path.join(ROOT, 'server', 'llm')
  const prismaDir = path.join(ROOT, 'prisma')
  const scriptsDir = path.join(ROOT, 'scripts')

  // 前端模块统计
  const platformPages = countFiles(path.join(srcModules, 'platform', 'pages'))
  const platformServices = listFiles(path.join(srcModules, 'platform', 'services'), ['.ts']).length
  const platformRepos = listFiles(path.join(srcModules, 'platform', 'repositories'), ['.ts']).length

  const tenantPageDirs = listSubdirs(path.join(srcModules, 'tenant', 'pages')).length
  const tenantPageFiles = listFiles(path.join(srcModules, 'tenant', 'pages'), ['.tsx', '.ts']).length
  const tenantServices = countFiles(path.join(srcModules, 'tenant', 'services'), ['.ts'])
  const tenantRepos = listFiles(path.join(srcModules, 'tenant', 'repositories'), ['.ts']).length
  const tenantSchemas = listFiles(path.join(srcModules, 'tenant', 'schemas'), ['.ts']).length
  const tenantMock = listFiles(path.join(srcModules, 'tenant', 'mock'), ['.ts']).length

  // 后端统计
  const domainFiles = listFiles(serverDomain, ['.ts']).length
  const llmFiles = listFiles(serverLlm, ['.ts']).length
  const llmProviderFiles = countFiles(path.join(serverLlm, 'providers'), ['.ts'])

  // Prisma 模型数（简单读取 model 关键字出现次数）
  let prismaModelCount = 0
  const schemaPath = path.join(prismaDir, 'schema.prisma')
  if (fs.existsSync(schemaPath)) {
    const schemaContent = fs.readFileSync(schemaPath, 'utf-8')
    prismaModelCount = (schemaContent.match(/^model\s+\w+\s+\{/gm) ?? []).length
  }

  // 迁移数量
  const migrationsDir = path.join(prismaDir, 'migrations')
  const migrationCount = fs.existsSync(migrationsDir)
    ? fs.readdirSync(migrationsDir).filter(d => d !== 'migration_lock.toml').length
    : 0

  // scripts 目录文件列表
  const scriptFiles = listFiles(scriptsDir)

  return {
    today: new Date().toISOString().slice(0, 10),
    platformPages,
    platformServices,
    platformRepos,
    tenantPageDirs,
    tenantPageFiles,
    tenantServices,
    tenantRepos,
    tenantSchemas,
    tenantMock,
    domainFiles,
    llmFiles: llmFiles + llmProviderFiles,
    prismaModelCount,
    migrationCount,
    scriptFiles,
  }
}

// ─── 更新 codebase-index.md 中的动态段落 ───────────────────────────────────────
function updateIndexDoc(stats) {
  if (!fs.existsSync(INDEX_PATH)) {
    console.error(`❌ 找不到 codebase-index.md：${INDEX_PATH}`)
    process.exit(1)
  }

  let content = fs.readFileSync(INDEX_PATH, 'utf-8')

  // 1. 更新基线/同步日期（支持"基线日期"或"最近同步"两种格式）
  content = content.replace(
    /^(> (?:基线日期|最近同步)：).+$/m,
    `$1${stats.today}（由 docs:index 自动同步）`
  )

  // 2. 更新 platform/ 统计摘要行
  content = content.replace(
    /├── services\/.*?# .+个 service.*$/m,
    `├── services/                       # ${stats.platformServices} 个 service（全部调真实 API）`
  )
  content = content.replace(
    /├── repositories\/.*?# .+个 repository.*$/m,
    `├── repositories/                   # ${stats.platformRepos} 个 repository（全部调 /api/*）`
  )

  // 3. 更新 tenant/ 统计摘要行
  content = content.replace(
    /├── services\/.*?# .+个 service 文件.*$/m,
    `├── services/                       # ${stats.tenantServices} 个 service 文件`
  )
  content = content.replace(
    /├── repositories\/.*?# .+个 repository.*$/m,
    `├── repositories/                   # ${stats.tenantRepos} 个 repository（全部调 /api/*）`
  )
  content = content.replace(
    /├── schemas\/.*?# .+个 schema 文件.*$/m,
    `├── schemas/                        # ${stats.tenantSchemas} 个 schema 文件`
  )
  content = content.replace(
    /└── mock\/.*?# .+个 mock 文件.*$/m,
    `└── mock/                           # ${stats.tenantMock} 个 mock 文件（渐进替换中）`
  )

  // 4. 更新 Prisma 统计
  content = content.replace(
    /├── schema\.prisma.*?# .+个模型.*$/m,
    `├── schema.prisma           # 数据模型定义（${stats.prismaModelCount} 个模型）`
  )

  // 5. 更新 scripts 表格（在"五、脚本"区域）
  const scriptsTableStart = content.indexOf('## 五、脚本')
  if (scriptsTableStart !== -1) {
    const tableHeaderEnd = content.indexOf('\n', content.indexOf('| 说明 |', scriptsTableStart))
    const tableEnd = content.indexOf('\n\n---', tableHeaderEnd)

    if (tableHeaderEnd !== -1 && tableEnd !== -1) {
      const scriptRows = stats.scriptFiles.map(name => {
        // 补充已知脚本说明
        const descMap = {
          'deploy-update.sh': '服务端更新脚本（git pull → npm ci → build → migrate → pm2 restart）',
          'README-deploy.md': '部署脚本说明',
          'docs-log-changes.mjs': '自动生成 CHANGELOG 草稿（从 git diff 读取变更文件）',
          'docs-sync-index.mjs': '同步更新 codebase-index.md 文件统计数据',
        }
        const desc = descMap[name] ?? '—'
        return `| \`${name}\` | ${desc} |`
      })

      const header = '| 文件 | 说明 |\n|------|------|'
      const newTable = header + '\n' + scriptRows.join('\n')

      const beforeTable = content.slice(0, content.indexOf('| 文件 | 说明 |', scriptsTableStart))
      const afterTable = content.slice(tableEnd)
      content = beforeTable + newTable + afterTable
    }
  }

  fs.writeFileSync(INDEX_PATH, content, 'utf-8')
}

// ─── 主流程 ────────────────────────────────────────────────────────────────────
console.log('🔍 正在扫描代码目录...')
const stats = collectStats()

console.log('\n📊 扫描结果：')
console.log(`   平台后台 services: ${stats.platformServices} 个`)
console.log(`   平台后台 repositories: ${stats.platformRepos} 个`)
console.log(`   租户后台 services: ${stats.tenantServices} 个`)
console.log(`   租户后台 repositories: ${stats.tenantRepos} 个`)
console.log(`   租户后台 schemas: ${stats.tenantSchemas} 个`)
console.log(`   后端 domain 文件: ${stats.domainFiles} 个`)
console.log(`   Prisma 模型数: ${stats.prismaModelCount} 个`)
console.log(`   scripts 文件: ${stats.scriptFiles.join(', ')}`)

updateIndexDoc(stats)

console.log('\n✅ codebase-index.md 已同步更新：')
console.log('   - 更新了同步日期')
console.log('   - 更新了各模块统计数字')
console.log('   - 更新了 scripts/ 文件列表')
console.log('\n   注意：文档中的描述性文字（模块说明、功能描述）不会被自动覆盖，')
console.log('         如有新增模块请手动在 codebase-index.md 添加说明行。')
