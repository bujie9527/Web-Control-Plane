/**
 * Skill 种子数据（与 platform mock 对齐 + 规划用 3 条），表为空时写入
 */
import { prisma } from './prismaClient'

const now = (): string => new Date().toISOString().slice(0, 19).replace('T', ' ')

interface SeedSkill {
  id: string
  name: string
  nameZh: string
  code: string
  category: string
  executionType: 'llm' | 'external_api' | 'internal_api' | 'hybrid'
  description: string
  openClawSpec?: {
    steps?: string[]
    inputSchemaJson?: string
    outputSchemaJson?: string
  }
  inputSchemaJson?: string
  outputSchemaJson?: string
  executionConfigJson?: string
  promptTemplate?: string
  requiredContextFields?: string[]
}

const SEED_SKILLS: SeedSkill[] = [
  {
    id: 'skill-content-write',
    name: 'Content Write',
    nameZh: '内容创作',
    code: 'CONTENT_WRITE',
    category: 'content',
    executionType: 'llm',
    description: '根据素材和人设生成内容',
    openClawSpec: {
      steps: ['分析素材', '提炼观点', '按渠道风格输出内容'],
      inputSchemaJson: '{"type":"object","properties":{"topic":{"type":"string"}},"required":["topic"]}',
      outputSchemaJson: '{"type":"object","properties":{"title":{"type":"string"},"content":{"type":"string"}},"required":["title","content"]}',
    },
    promptTemplate: '请围绕 {input.topic} 创作内容，素材：{input.researchData}，输出 JSON。',
    requiredContextFields: ['identity', 'channelStyle'],
  },
  {
    id: 'skill-content-review',
    name: 'Content Review',
    nameZh: '内容审核',
    code: 'CONTENT_REVIEW',
    category: 'review',
    executionType: 'llm',
    description: '审核内容质量与事实一致性',
    promptTemplate: '请审核以下内容并给出结论与问题列表：{input.content}',
  },
  {
    id: 'skill-compliance-check',
    name: 'Compliance Check',
    nameZh: '合规检查',
    code: 'COMPLIANCE_CHECK',
    category: 'review',
    executionType: 'llm',
    description: '检查内容是否触发平台合规风险',
    promptTemplate: '请检查该内容合规性并输出风险等级：{input.content}',
  },
  {
    id: 'skill-publish',
    name: 'Publish Content',
    nameZh: '内容发布',
    code: 'PUBLISH_CONTENT',
    category: 'publish',
    executionType: 'external_api',
    description: '调用终端执行发布',
    executionConfigJson:
      '{"type":"external_api","provider":"telegram","method":"sendMessage","paramMapping":{"terminalId":"{{context.terminalId}}","actionType":"text","text":"{{input.content}}"}}',
  },
  {
    id: 'skill-schedule',
    name: 'Schedule Publish',
    nameZh: '计划发布',
    code: 'SCHEDULE_PUBLISH',
    category: 'publish',
    executionType: 'internal_api',
    description: '写入系统定时任务（占位）',
    executionConfigJson:
      '{"type":"internal_api","endpoint":"/api/scheduled-tasks","method":"POST","paramMapping":{"title":"{{input.title}}","runAt":"{{input.runAt}}"}}',
  },
  {
    id: 'skill-data-fetch',
    name: 'Data Fetch',
    nameZh: '数据获取',
    code: 'DATA_FETCH',
    category: 'analytics',
    executionType: 'external_api',
    description: '通过数据源 Provider 拉取外部信息',
    executionConfigJson:
      '{"type":"external_api","provider":"tavily","method":"search","paramMapping":{"query":"{{input.query}}","limit":"{{input.limit}}"}}',
  },
  {
    id: 'skill-metrics-write',
    name: 'Metrics Write',
    nameZh: '指标写入',
    code: 'METRICS_WRITE',
    category: 'analytics',
    executionType: 'llm',
    description: '生成可写入报表的指标摘要',
    promptTemplate: '根据输入数据生成指标摘要：{input.metrics}',
  },
  {
    id: 'skill-keyword-research',
    name: 'Keyword Research',
    nameZh: '关键词研究',
    code: 'KEYWORD_RESEARCH',
    category: 'research',
    executionType: 'hybrid',
    description: '先生成检索词，再调用数据源，最后汇总结果',
    executionConfigJson:
      '{"type":"hybrid","stages":[{"name":"generate_queries","executionType":"llm","promptTemplate":"为主题 {input.topic} 生成 3 个检索词"},{"name":"search","executionType":"external_api","provider":"tavily","method":"search","paramMapping":{"query":"{{input.topic}}","limit":"{{input.limit}}"}},{"name":"summarize","executionType":"llm","promptTemplate":"请汇总检索结果：{input.previousOutputs}"}]}',
  },
  {
    id: 'skill-parse-sop',
    name: 'Parse SOP',
    nameZh: 'SOP 解析',
    code: 'PARSE_SOP',
    category: 'planning',
    executionType: 'llm',
    description: '将 SOP 自然语言解析为结构化步骤',
    promptTemplate: '请将以下 SOP 拆解为结构化步骤：{input.sop}',
  },
  {
    id: 'skill-generate-draft',
    name: 'Generate Workflow Draft',
    nameZh: '生成流程草案',
    code: 'GENERATE_WORKFLOW_DRAFT',
    category: 'planning',
    executionType: 'llm',
    description: '根据上下文生成 Workflow 草案',
    promptTemplate: '请基于输入生成 workflow draft：{input.context}',
  },
  {
    id: 'skill-revise-draft',
    name: 'Revise Workflow Draft',
    nameZh: '修订流程草案',
    code: 'REVISE_WORKFLOW_DRAFT',
    category: 'planning',
    executionType: 'llm',
    description: '按用户反馈修订流程草案',
    promptTemplate: '请按反馈修订 draft：{input.feedback}，当前草案：{input.draft}',
  },
  {
    id: 'skill-summarize-changes',
    name: 'Summarize Changes',
    nameZh: '变更摘要',
    code: 'SUMMARIZE_CHANGES',
    category: 'planning',
    executionType: 'llm',
    description: '生成草案前后变化摘要',
    promptTemplate: '请总结变更点：before={input.before} after={input.after}',
  },
  {
    id: 'skill-suggest-agent-bindings',
    name: 'Suggest Agent Bindings',
    nameZh: '建议 Agent 绑定',
    code: 'SUGGEST_AGENT_BINDINGS',
    category: 'planning',
    executionType: 'llm',
    description: '根据节点意图给出建议 Agent 绑定',
    promptTemplate: '请为以下节点建议 Agent：{input.nodes}',
  },
  {
    id: 'skill-image-gen',
    name: 'Image Generation',
    nameZh: '图像生成',
    code: 'IMAGE_GEN',
    category: 'content',
    executionType: 'llm',
    description: '根据主题生成配图建议',
    promptTemplate: '请生成配图建议：{input.topic}',
  },
  {
    id: 'skill-brand-check',
    name: 'Brand Check',
    nameZh: '品牌调性检查',
    code: 'BRAND_CHECK',
    category: 'review',
    executionType: 'llm',
    description: '检查内容是否符合品牌调性',
    promptTemplate: '请检查是否符合品牌调性：{input.content}',
  },
  {
    id: 'skill-fb-optimize',
    name: 'Facebook Optimize',
    nameZh: 'Facebook 优化',
    code: 'FB_OPTIMIZE',
    category: 'publish',
    executionType: 'external_api',
    description: '针对 Facebook 渠道进行发布参数优化',
    executionConfigJson:
      '{"type":"external_api","provider":"facebook_page","method":"optimize","paramMapping":{"text":"{{input.content}}"}}',
  },
  {
    id: 'skill-search-web',
    name: 'Search Web For Topic',
    nameZh: 'Web 搜索',
    code: 'SEARCH_WEB',
    category: 'research',
    executionType: 'external_api',
    description: '按主题调用 Web 搜索',
    executionConfigJson:
      '{"type":"external_api","provider":"tavily","method":"search","paramMapping":{"query":"{{input.searchQuery}}","limit":"{{input.maxResults}}"}}',
  },
  {
    id: 'skill-monitor-social',
    name: 'Monitor Social Media',
    nameZh: '社媒监控',
    code: 'MONITOR_SOCIAL',
    category: 'research',
    executionType: 'external_api',
    description: '调用 Apify 监控社交媒体动态',
    executionConfigJson:
      '{"type":"external_api","provider":"apify","method":"monitor","paramMapping":{"query":"{{input.searchQuery}}"}}',
  },
  {
    id: 'skill-send-telegram-msg',
    name: 'Send Telegram Message',
    nameZh: '发送 Telegram 消息',
    code: 'SEND_TELEGRAM_MSG',
    category: 'publish',
    executionType: 'external_api',
    description: '通过 Telegram 终端发送文本',
    executionConfigJson:
      '{"type":"external_api","provider":"telegram","method":"sendMessage","paramMapping":{"terminalId":"{{context.terminalId}}","actionType":"text","text":"{{input.content}}"}}',
  },
  {
    id: 'skill-classify-intent',
    name: 'Classify Intent',
    nameZh: '意图分类',
    code: 'CLASSIFY_INTENT',
    category: 'interaction',
    executionType: 'llm',
    description: '识别用户消息意图并返回分类',
    promptTemplate: '请将用户消息分类为 question | command | config | abuse：{input.userText}',
  },
  {
    id: 'skill-generate-reply',
    name: 'Generate Reply',
    nameZh: '生成回复',
    code: 'GENERATE_REPLY',
    category: 'interaction',
    executionType: 'llm',
    description: '根据上下文与身份生成回复',
    promptTemplate: '请根据上下文生成中文回复：{input.userText}',
  },
  {
    id: 'skill-welcome-member',
    name: 'Welcome Member',
    nameZh: '欢迎新成员',
    code: 'WELCOME_MEMBER',
    category: 'community',
    executionType: 'hybrid',
    description: '生成欢迎词并发送到 Telegram',
    executionConfigJson:
      '{"type":"hybrid","stages":[{"name":"compose","executionType":"llm","promptTemplate":"为新成员生成欢迎词：{input.memberName}"},{"name":"send","executionType":"external_api","provider":"telegram","method":"sendMessage","paramMapping":{"terminalId":"{{context.terminalId}}","actionType":"text","text":"{{stages.compose.output.rawText}}"}}]}',
  },
  {
    id: 'skill-create-poll',
    name: 'Create Poll',
    nameZh: '发起投票',
    code: 'CREATE_POLL',
    category: 'community',
    executionType: 'external_api',
    description: '在 Telegram 群组发起投票',
    executionConfigJson:
      '{"type":"external_api","provider":"telegram","method":"sendPoll","paramMapping":{"terminalId":"{{context.terminalId}}","actionType":"poll","question":"{{input.question}}","options":"{{input.options}}"}}',
  },
  {
    id: 'skill-pin-message',
    name: 'Pin Message',
    nameZh: '置顶消息',
    code: 'PIN_MESSAGE',
    category: 'community',
    executionType: 'external_api',
    description: '置顶指定消息（占位）',
    executionConfigJson:
      '{"type":"external_api","provider":"telegram","method":"pinMessage","paramMapping":{"terminalId":"{{context.terminalId}}","messageId":"{{input.messageId}}"}}',
  },
  {
    id: 'skill-delete-message',
    name: 'Delete Message',
    nameZh: '删除消息',
    code: 'DELETE_MESSAGE',
    category: 'community',
    executionType: 'external_api',
    description: '删除违规消息（占位）',
    executionConfigJson:
      '{"type":"external_api","provider":"telegram","method":"deleteMessage","paramMapping":{"terminalId":"{{context.terminalId}}","messageId":"{{input.messageId}}"}}',
  },
  {
    id: 'skill-parse-config-intent',
    name: 'Parse Config Intent',
    nameZh: '解析配置意图',
    code: 'PARSE_CONFIG_INTENT',
    category: 'config',
    executionType: 'llm',
    description: '将自然语言需求解析成配置动作',
    promptTemplate: '请将用户需求解析为配置动作 JSON：{input.userText}',
  },
  {
    id: 'skill-list-available-resources',
    name: 'List Available Resources',
    nameZh: '查询可用资源',
    code: 'LIST_AVAILABLE_RESOURCES',
    category: 'config',
    executionType: 'internal_api',
    description: '查询当前租户可用资源（占位）',
    executionConfigJson:
      '{"type":"internal_api","endpoint":"/api/system/resources","method":"GET"}',
  },
  {
    id: 'skill-configure-project-agent',
    name: 'Configure Project Agent',
    nameZh: '配置项目 Agent 参数',
    code: 'CONFIGURE_PROJECT_AGENT',
    category: 'config',
    executionType: 'internal_api',
    description: '写入项目级 Agent 覆盖参数',
    executionConfigJson:
      '{"type":"internal_api","endpoint":"/api/projects/:projectId/agent-configs/:agentTemplateId","method":"PUT"}',
  },
  {
    id: 'skill-compose-research-pack',
    name: 'Compose Research Pack',
    nameZh: '组装研究素材包',
    code: 'COMPOSE_RESEARCH_PACK',
    category: 'research',
    executionType: 'llm',
    description: '汇总搜索和监控结果，输出结构化素材包',
    promptTemplate: '请把输入数据整理成 ResearchPack JSON：{input}',
  },
]

export async function migrateSkillExecutionTypeToExternalApi(): Promise<void> {
  await prisma.skill.updateMany({
    where: { executionType: 'tool' },
    data: { executionType: 'external_api' },
  })
}

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
        description: s.description ?? null,
        version: '1.0.0',
        status: 'active',
        isSystemPreset: true,
        openClawSpecJson: s.openClawSpec ? JSON.stringify(s.openClawSpec) : null,
        inputSchemaJson: s.inputSchemaJson ?? null,
        outputSchemaJson: s.outputSchemaJson ?? null,
        executionConfigJson: s.executionConfigJson ?? null,
        promptTemplate: s.promptTemplate ?? null,
        requiredContextFields: s.requiredContextFields ? JSON.stringify(s.requiredContextFields) : null,
        estimatedDurationMs: null,
        retryable: true,
        maxRetries: 1,
        createdAt: ts,
        updatedAt: ts,
      },
    })
  }
}

/**
 * 持续对齐 Skill 基线：补齐新增字段与新增 Skill（不依赖表为空）
 */
export async function seedSkillBaselines(): Promise<void> {
  const ts = now()
  for (const s of SEED_SKILLS) {
    const existing = await prisma.skill.findUnique({ where: { code: s.code }, select: { id: true } })
    if (!existing) {
      await prisma.skill.create({
        data: {
          id: s.id,
          name: s.name,
          nameZh: s.nameZh,
          code: s.code,
          category: s.category,
          executionType: s.executionType,
          description: s.description,
          version: '1.0.0',
          status: 'active',
          isSystemPreset: true,
          openClawSpecJson: s.openClawSpec ? JSON.stringify(s.openClawSpec) : null,
          inputSchemaJson: s.inputSchemaJson ?? null,
          outputSchemaJson: s.outputSchemaJson ?? null,
          executionConfigJson: s.executionConfigJson ?? null,
          promptTemplate: s.promptTemplate ?? null,
          requiredContextFields: s.requiredContextFields
            ? JSON.stringify(s.requiredContextFields)
            : null,
          estimatedDurationMs: null,
          retryable: true,
          maxRetries: 1,
          createdAt: ts,
          updatedAt: ts,
        },
      })
      continue
    }
    await prisma.skill.update({
      where: { code: s.code },
      data: {
        name: s.name,
        nameZh: s.nameZh,
        category: s.category,
        executionType: s.executionType,
        description: s.description,
        openClawSpecJson: s.openClawSpec ? JSON.stringify(s.openClawSpec) : null,
        inputSchemaJson: s.inputSchemaJson ?? null,
        outputSchemaJson: s.outputSchemaJson ?? null,
        executionConfigJson: s.executionConfigJson ?? null,
        promptTemplate: s.promptTemplate ?? null,
        requiredContextFields: s.requiredContextFields
          ? JSON.stringify(s.requiredContextFields)
          : null,
        retryable: true,
        maxRetries: 1,
        updatedAt: ts,
      },
    })
  }
}
