/**
 * Skill 种子数据（与 platform mock 对齐 + 规划用 3 条），表为空时写入
 */
import { prisma } from './prismaClient'

const now = (): string => new Date().toISOString().slice(0, 19).replace('T', ' ')

const SEED_SKILLS = [
  { id: 'skill-content-write', name: 'Content Write', nameZh: '内容创作', code: 'CONTENT_WRITE', category: 'content', executionType: 'llm' },
  { id: 'skill-content-review', name: 'Content Review', nameZh: '内容审核', code: 'CONTENT_REVIEW', category: 'review', executionType: 'llm' },
  { id: 'skill-compliance-check', name: 'Compliance Check', nameZh: '合规检查', code: 'COMPLIANCE_CHECK', category: 'review', executionType: 'llm' },
  { id: 'skill-publish', name: 'Publish Content', nameZh: '内容发布', code: 'PUBLISH_CONTENT', category: 'publish', executionType: 'tool' },
  { id: 'skill-schedule', name: 'Schedule Publish', nameZh: '计划发布', code: 'SCHEDULE_PUBLISH', category: 'publish', executionType: 'tool' },
  { id: 'skill-data-fetch', name: 'Data Fetch', nameZh: '数据获取', code: 'DATA_FETCH', category: 'analytics', executionType: 'tool' },
  { id: 'skill-metrics-write', name: 'Metrics Write', nameZh: '指标写入', code: 'METRICS_WRITE', category: 'analytics', executionType: 'llm' },
  { id: 'skill-keyword-research', name: 'Keyword Research', nameZh: '关键词研究', code: 'KEYWORD_RESEARCH', category: 'research', executionType: 'hybrid' },
  { id: 'skill-parse-sop', name: 'Parse SOP', nameZh: 'SOP 解析', code: 'PARSE_SOP', category: 'planning', executionType: 'llm' },
  { id: 'skill-generate-draft', name: 'Generate Workflow Draft', nameZh: '生成流程草案', code: 'GENERATE_WORKFLOW_DRAFT', category: 'planning', executionType: 'llm' },
  { id: 'skill-revise-draft', name: 'Revise Workflow Draft', nameZh: '修订流程草案', code: 'REVISE_WORKFLOW_DRAFT', category: 'planning', executionType: 'llm' },
  { id: 'skill-summarize-changes', name: 'Summarize Changes', nameZh: '变更摘要', code: 'SUMMARIZE_CHANGES', category: 'planning', executionType: 'llm' },
  { id: 'skill-suggest-agent-bindings', name: 'Suggest Agent Bindings', nameZh: '建议 Agent 绑定', code: 'SUGGEST_AGENT_BINDINGS', category: 'planning', executionType: 'llm' },
  { id: 'skill-image-gen', name: 'Image Generation', nameZh: '图像生成', code: 'IMAGE_GEN', category: 'content', executionType: 'llm' },
  { id: 'skill-brand-check', name: 'Brand Check', nameZh: '品牌调性检查', code: 'BRAND_CHECK', category: 'review', executionType: 'llm' },
  { id: 'skill-fb-optimize', name: 'Facebook Optimize', nameZh: 'Facebook 优化', code: 'FB_OPTIMIZE', category: 'publish', executionType: 'tool' },
]

export async function seedSkillsIfEmpty(): Promise<void> {
  const count = await prisma.skill.count()
  if (count > 0) return
  const ts = now()
  for (const s of SEED_SKILLS) {
    await prisma.skill.create({
      data: {
        id: s.id,
        name: s.name,
        nameZh: s.nameZh,
        code: s.code,
        category: s.category,
        executionType: s.executionType,
        description: null,
        version: '1.0.0',
        status: 'active',
        isSystemPreset: true,
        openClawSpecJson: null,
        createdAt: ts,
        updatedAt: ts,
      },
    })
  }
}
