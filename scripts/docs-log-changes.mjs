#!/usr/bin/env node
/**
 * docs:log — 自动生成开发变更日志条目
 *
 * 用法：npm run docs:log
 *
 * 功能：
 *   1. 从 git 读取已修改文件（staged → unstaged → 上一次提交）
 *   2. 按模块分组
 *   3. 在 docs/status/CHANGELOG.md 顶部插入带文件列表的草稿条目
 *   4. 提示开发者填写标题与变更说明
 */
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const CHANGELOG_PATH = path.join(ROOT, 'docs', 'status', 'CHANGELOG.md')

// ─── 模块路径 → 中文分组标签（从最具体到最通用顺序排列）───────────────────────
const MODULE_GROUPS = [
  ['server/llm/',                                    'LLM 服务层'],
  ['server/domain/',                                 '数据领域层（Prisma）'],
  ['server/auth/',                                   '认证服务'],
  ['server/data/',                                   '数据存储（凭证/集成配置）'],
  ['server/services/',                               '后端服务'],
  ['server/index.ts',                                '后端路由主入口'],
  ['src/modules/platform/pages/LLMConfigCenter/',    '模型配置中心'],
  ['src/modules/platform/pages/AgentFactory/',       'Agent 模板工厂'],
  ['src/modules/platform/pages/SkillFactory/',       'Skill 工厂'],
  ['src/modules/platform/pages/WorkflowTemplates/',  '流程模板工厂'],
  ['src/modules/platform/pages/WorkflowPlanning/',   '流程规划（系统）'],
  ['src/modules/platform/pages/PlatformCapabilities/','平台能力注册'],
  ['src/modules/platform/pages/',                    '平台/系统后台页面'],
  ['src/modules/platform/services/',                 '平台后台服务层'],
  ['src/modules/platform/repositories/',             '平台后台数据层'],
  ['src/modules/platform/',                          '平台/系统后台（其他）'],
  ['src/modules/tenant/pages/ProjectDetail/',        '项目详情工作台'],
  ['src/modules/tenant/pages/',                      '租户后台页面'],
  ['src/modules/tenant/services/adapters/',          'LLM 适配器'],
  ['src/modules/tenant/services/',                   '租户后台服务层'],
  ['src/modules/tenant/repositories/',               '租户后台数据层'],
  ['src/modules/tenant/schemas/',                    '租户后台 Schema'],
  ['src/modules/tenant/mock/',                       'Mock 数据'],
  ['src/modules/tenant/',                            '租户后台（其他）'],
  ['src/core/labels/',                               '中文标签映射'],
  ['src/core/',                                      '核心层'],
  ['src/components/',                                '通用 UI 组件'],
  ['src/app/',                                       '路由与应用入口'],
  ['prisma/',                                        'Prisma 数据模型/迁移'],
  ['scripts/',                                       '运维脚本'],
  ['docs/status/',                                   '开发状态文档'],
  ['docs/',                                          '文档'],
  ['.cursor/rules/',                                 'Cursor 规则'],
  ['.cursor/',                                       'Cursor 配置'],
  ['CLAUDE.md',                                      'AI 协作指南'],
]

// ─── git 读取变更文件 ───────────────────────────────────────────────────────────
function getChangedFiles() {
  const run = (cmd) => {
    try {
      return execSync(cmd, { cwd: ROOT, stdio: 'pipe' }).toString().trim()
    } catch {
      return ''
    }
  }

  // 1. staged 变更
  const staged = run('git diff --cached --name-only')
    .split('\n').filter(Boolean)

  // 2. unstaged 变更
  const unstaged = run('git diff --name-only')
    .split('\n').filter(Boolean)

  // 3. 合并，去重
  let all = [...new Set([...staged, ...unstaged])]

  // 4. 若无工作区变更，读取最近一次提交
  if (all.length === 0) {
    const lastCommit = run('git diff HEAD~1 HEAD --name-only')
      .split('\n').filter(Boolean)
    if (lastCommit.length > 0) {
      all = lastCommit
      console.log('ℹ  工作区无变更，使用最近一次提交的文件列表。')
    }
  }

  return all.map(f => f.replace(/\\/g, '/'))
}

// ─── 分组 ──────────────────────────────────────────────────────────────────────
function groupFiles(files) {
  const groups = new Map()

  for (const file of files) {
    let matched = false
    for (const [prefix, label] of MODULE_GROUPS) {
      if (file.startsWith(prefix) || file === prefix) {
        if (!groups.has(label)) groups.set(label, [])
        groups.get(label).push(file)
        matched = true
        break
      }
    }
    if (!matched) {
      const label = '其他'
      if (!groups.has(label)) groups.set(label, [])
      groups.get(label).push(file)
    }
  }

  return groups
}

// ─── 生成条目文本 ──────────────────────────────────────────────────────────────
function generateEntry(groups, totalCount) {
  const today = new Date().toISOString().slice(0, 10)

  const rangeLines = []
  for (const [group, files] of groups.entries()) {
    // 跳过纯文档变更：不在"影响范围"中列出，减少噪声
    if (group === '开发状态文档' || group === 'Cursor 规则') continue
    const filePaths = files.map(f => `\`${f}\``).join('、')
    rangeLines.push(`- **${group}**：${filePaths}`)
  }

  const rangeSection = rangeLines.length > 0
    ? rangeLines.join('\n')
    : '- —'

  return (
    `## [${today}] ← 填写本次变更标题\n\n` +
    `### 变更内容\n- ← 填写具体变更说明（可多条）\n\n` +
    `### 影响范围（共 ${totalCount} 个文件）\n${rangeSection}\n\n` +
    `### 方向调整（如有）\n- —\n`
  )
}

// ─── 写入 CHANGELOG ────────────────────────────────────────────────────────────
function prependToChangelog(newEntry) {
  if (!fs.existsSync(CHANGELOG_PATH)) {
    console.error(`❌ 找不到 CHANGELOG.md：${CHANGELOG_PATH}`)
    process.exit(1)
  }

  // 统一转为 LF，避免 Windows CRLF 影响字符串匹配
  const raw = fs.readFileSync(CHANGELOG_PATH, 'utf-8')
  const content = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  // 找到第一个实际条目（## [YYYY...）之前的 ---\n\n 位置
  // 格式：...格式示例 ```\n\n---\n\n## [xxxx...
  const ENTRY_MARKER = '\n---\n\n## ['
  const idx = content.indexOf(ENTRY_MARKER)

  let updated
  if (idx === -1) {
    // 找不到分隔符时，追加到文件末尾（兜底）
    updated = content.trimEnd() + '\n\n---\n\n' + newEntry
  } else {
    // 在第一个实际条目之前插入（紧跟 ---\n\n 之后）
    const insertAt = idx + '\n---\n\n'.length
    updated =
      content.slice(0, insertAt) +
      newEntry +
      '\n---\n\n' +
      content.slice(insertAt)
  }

  // 写回（统一 LF，不引入 CRLF）
  fs.writeFileSync(CHANGELOG_PATH, updated, 'utf-8')
}

// ─── 主流程 ────────────────────────────────────────────────────────────────────
const files = getChangedFiles()

if (files.length === 0) {
  console.log('⚠  未检测到任何变更文件，脚本退出。')
  console.log('   提示：git add 或修改文件后再运行 npm run docs:log')
  process.exit(0)
}

console.log(`📂 检测到 ${files.length} 个变更文件`)
const groups = groupFiles(files)
const entry = generateEntry(groups, files.length)
prependToChangelog(entry)

console.log('\n✅ CHANGELOG.md 已插入新草稿条目。')
console.log('📝 请打开 docs/status/CHANGELOG.md，完成以下填写：')
console.log('   1. ← 填写本次变更标题（简短、说明变更性质）')
console.log('   2. ← 填写具体变更说明（每条一行，说明做了什么）')
console.log('   3. 如有架构/方向变化，填写"方向调整"说明')
console.log('\n   文件已在：docs/status/CHANGELOG.md')
