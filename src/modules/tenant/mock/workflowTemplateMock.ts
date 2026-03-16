/**
 * 流程模板工厂 Mock（system + tenant 双层作用域）
 */
import type { WorkflowTemplate, WorkflowTemplateStatus } from '../schemas/workflowExecution'
import { cloneNodesToTemplate } from './workflowTemplateNodeMock'

export interface WorkflowTemplateListParams {
  page?: number
  pageSize?: number
  keyword?: string
  tenantId?: string
  scopeType?: 'system' | 'tenant'
  status?: WorkflowTemplateStatus
  projectType?: string
  goalType?: string
  deliverableMode?: string
  planningMode?: 'manual' | 'ai_assisted' | 'hybrid'
  isSystemPreset?: boolean
}

const now = (): string => new Date().toISOString().slice(0, 19).replace('T', ' ')

const _templates: WorkflowTemplate[] = [
  {
    id: 'wt1',
    name: '社媒发布流程',
    code: 'SOCIAL_PUBLISH',
    type: 'publish',
    description: '标准社媒内容撰写、审核、发布流程',
    scopeType: 'tenant',
    tenantId: 't1',
    status: 'active',
    version: 1,
    isLatest: true,
    isSystemPreset: false,
    supportedProjectTypeId: 'pt-account-operation',
    supportedGoalTypeIds: ['gt-account-followers', 'gt-account-engagement'],
    supportedDeliverableModes: ['social_content'],
    supportedChannels: ['facebook', 'x'],
    planningMode: 'manual',
    nodeCount: 3,
    createdAt: '2025-02-01 10:00',
    updatedAt: '2025-03-01 10:00',
    applicableGoalTypes: ['growth'],
    applicableDeliverableTypes: ['content'],
  },
  {
    id: 'wt2',
    name: '内容审核流程',
    code: 'CONTENT_REVIEW',
    type: 'review',
    description: '内容合规审核与人工抽检',
    scopeType: 'tenant',
    tenantId: 't1',
    status: 'active',
    version: 1,
    isLatest: true,
    isSystemPreset: false,
    supportedProjectTypeId: 'pt-account-operation',
    supportedGoalTypeIds: ['gt-account-engagement'],
    supportedDeliverableModes: ['social_content'],
    supportedChannels: ['facebook', 'x'],
    planningMode: 'manual',
    nodeCount: 3,
    createdAt: '2025-02-15 10:00',
    updatedAt: '2025-02-20 10:00',
    applicableGoalTypes: ['brand'],
    applicableDeliverableTypes: ['content'],
  },
  {
    id: 'wt3',
    name: '数据同步流程',
    code: 'DATA_SYNC',
    type: 'sync',
    description: '多源数据拉取与看板更新',
    scopeType: 'tenant',
    tenantId: 't1',
    status: 'active',
    version: 1,
    isLatest: true,
    isSystemPreset: false,
    supportedProjectTypeId: 'pt-website-operation',
    supportedGoalTypeIds: ['gt-index-count'],
    supportedDeliverableModes: ['data_sync'],
    planningMode: 'manual',
    nodeCount: 2,
    createdAt: '2025-01-20 10:00',
    updatedAt: '2025-02-10 10:00',
    applicableGoalTypes: ['other'],
    applicableDeliverableTypes: ['data'],
  },
  {
    id: 'wt-facebook-system',
    name: 'Facebook 社媒闭环',
    code: 'FB_SOCIAL_LOOP',
    type: 'publish',
    description: '内容生成 → 内容审核 → 发布 → 结果记录',
    scopeType: 'system',
    status: 'active',
    version: 1,
    isLatest: true,
    isSystemPreset: true,
    supportedProjectTypeId: 'pt-account-operation',
    supportedGoalTypeIds: ['gt-account-followers', 'gt-account-engagement'],
    supportedDeliverableModes: ['social_content'],
    supportedChannels: ['facebook'],
    supportedIdentityTypeIds: ['brand_official', 'koc'],
    planningMode: 'hybrid',
    recommendedAgentTemplateIds: [
      'at-facebook-content-creator',
      'at-content-reviewer',
      'at-publisher',
      'at-performance-recorder',
    ],
    recommendedSkillIds: [
      'skill-content-write',
      'skill-content-review',
      'skill-publish',
      'skill-metrics-write',
    ],
    defaultReviewPolicy: { requireHumanReview: true },
    nodeCount: 4,
    createdAt: '2025-03-08 10:00',
    updatedAt: '2025-03-08 10:00',
    applicableGoalTypes: ['growth'],
    applicableDeliverableTypes: ['content'],
  },
  {
    id: 'wt-seo-system',
    name: 'SEO 内容生产标准流程',
    code: 'SEO_CONTENT_STANDARD',
    type: 'seo',
    description: '关键词研究 → 大纲生成 → 内容撰写 → 审核发布',
    scopeType: 'system',
    status: 'active',
    version: 1,
    isLatest: true,
    isSystemPreset: true,
    supportedProjectTypeId: 'pt-website-operation',
    supportedGoalTypeIds: ['gt-index-count', 'gt-keyword-rank', 'gt-organic-traffic'],
    supportedDeliverableModes: ['seo_article'],
    supportedChannels: ['website'],
    supportedIdentityTypeIds: ['expert', 'assistant'],
    planningMode: 'ai_assisted',
    recommendedAgentTemplateIds: ['at-base-content-creator', 'at-content-reviewer'],
    recommendedSkillIds: ['skill-content-write', 'skill-content-review'],
    defaultReviewPolicy: { requireHumanReview: true, requireNodeReview: true },
    nodeCount: 4,
    createdAt: '2025-03-08 10:10',
    updatedAt: '2025-03-08 10:10',
    applicableGoalTypes: ['other'],
    applicableDeliverableTypes: ['content'],
  },
  {
    id: 'wt-facebook-tenant-t1',
    name: 'Facebook 社媒闭环-租户自定义版',
    code: 'FB_SOCIAL_LOOP_T1',
    type: 'publish',
    description: '基于平台模板复制，适配租户执行偏好',
    scopeType: 'tenant',
    tenantId: 't1',
    status: 'draft',
    version: 1,
    isLatest: true,
    isSystemPreset: false,
    sourceTemplateId: 'wt-facebook-system',
    sourceVersion: 1,
    clonedFromTemplateId: 'wt-facebook-system',
    supportedProjectTypeId: 'pt-account-operation',
    supportedGoalTypeIds: ['gt-account-followers', 'gt-account-engagement'],
    supportedDeliverableModes: ['social_content'],
    supportedChannels: ['facebook'],
    supportedIdentityTypeIds: ['brand_official'],
    planningMode: 'hybrid',
    recommendedAgentTemplateIds: [
      'at-facebook-content-creator',
      'at-content-reviewer',
      'at-publisher',
      'at-performance-recorder',
    ],
    recommendedSkillIds: ['skill-content-write', 'skill-content-review', 'skill-publish'],
    defaultReviewPolicy: { requireHumanReview: true },
    nodeCount: 4,
    createdAt: '2025-03-08 11:00',
    updatedAt: '2025-03-08 11:00',
    applicableGoalTypes: ['growth'],
    applicableDeliverableTypes: ['content'],
  },
  /** 兼容旧流程 ID */
  {
    id: 'wt-facebook',
    name: 'Facebook 社媒闭环（兼容）',
    code: 'FB_SOCIAL_LOOP_COMPAT',
    type: 'publish',
    description: '兼容历史任务引用',
    scopeType: 'tenant',
    tenantId: 't1',
    status: 'active',
    version: 1,
    isLatest: true,
    isSystemPreset: false,
    sourceTemplateId: 'wt-facebook-system',
    sourceVersion: 1,
    clonedFromTemplateId: 'wt-facebook-system',
    supportedProjectTypeId: 'pt-account-operation',
    supportedGoalTypeIds: ['gt-account-followers'],
    supportedDeliverableModes: ['social_content'],
    supportedChannels: ['facebook'],
    planningMode: 'hybrid',
    recommendedAgentTemplateIds: ['at-facebook-content-creator'],
    nodeCount: 4,
    createdAt: '2025-03-08 10:00',
    updatedAt: '2025-03-08 10:00',
    applicableGoalTypes: ['growth'],
    applicableDeliverableTypes: ['content'],
  },
]

function nextId(): string {
  return `wt-${Date.now()}`
}

export function nextVersionGroupId(): string {
  return `vg-${Date.now()}`
}

export function listWorkflowTemplates(params: WorkflowTemplateListParams): {
  items: WorkflowTemplate[]
  total: number
} {
  const {
    page = 1,
    pageSize = 20,
    keyword,
    tenantId,
    scopeType,
    status,
    projectType,
    goalType,
    deliverableMode,
    planningMode,
    isSystemPreset,
  } = params
  let list = [..._templates]
  if (tenantId) {
    list = list.filter((t) => t.scopeType === 'system' || t.tenantId === tenantId)
  }
  if (scopeType) list = list.filter((t) => t.scopeType === scopeType)
  if (status) list = list.filter((t) => t.status === status)
  if (projectType) list = list.filter((t) => t.supportedProjectTypeId === projectType)
  if (goalType) list = list.filter((t) => t.supportedGoalTypeIds.includes(goalType))
  if (deliverableMode) {
    list = list.filter((t) => t.supportedDeliverableModes.includes(deliverableMode))
  }
  if (planningMode) list = list.filter((t) => t.planningMode === planningMode)
  if (typeof isSystemPreset === 'boolean') {
    list = list.filter((t) => t.isSystemPreset === isSystemPreset)
  }
  if (keyword?.trim()) {
    const k = keyword.trim().toLowerCase()
    list = list.filter(
      (t) =>
        t.name.toLowerCase().includes(k) ||
        t.code.toLowerCase().includes(k) ||
        t.description?.toLowerCase().includes(k)
    )
  }
  list.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
  const total = list.length
  const start = (page - 1) * pageSize
  return { items: list.slice(start, start + pageSize), total }
}

export function getWorkflowTemplateById(id: string): WorkflowTemplate | null {
  return _templates.find((t) => t.id === id) ?? null
}

/** 按版本组查询模板列表（Phase 12.5） */
export function getTemplatesByVersionGroupId(versionGroupId: string): WorkflowTemplate[] {
  return _templates
    .filter((t) => t.versionGroupId === versionGroupId)
    .sort((a, b) => a.version - b.version)
}

export function createWorkflowTemplate(
  payload: Partial<WorkflowTemplate> &
    Pick<
      WorkflowTemplate,
      | 'name'
      | 'code'
      | 'scopeType'
      | 'supportedProjectTypeId'
      | 'supportedGoalTypeIds'
      | 'supportedDeliverableModes'
      | 'planningMode'
    >
): WorkflowTemplate {
  const templateId = nextId()
  const created: WorkflowTemplate = {
    id: templateId,
    name: payload.name,
    code: payload.code,
    type: payload.type ?? 'custom',
    description: payload.description,
    scopeType: payload.scopeType,
    tenantId: payload.scopeType === 'tenant' ? payload.tenantId : undefined,
    status: payload.status ?? 'draft',
    version: payload.version ?? 1,
    isLatest: payload.isLatest ?? true,
    isSystemPreset: payload.isSystemPreset ?? false,
    sourceTemplateId: payload.sourceTemplateId,
    sourceVersion: payload.sourceVersion,
    clonedFromTemplateId: payload.clonedFromTemplateId,
    sourcePlanningSessionId: payload.sourcePlanningSessionId,
    sourcePlanningDraftId: payload.sourcePlanningDraftId,
    sourceDraftVersion: payload.sourceDraftVersion,
    versionGroupId: payload.versionGroupId,
    previousVersionTemplateId: payload.previousVersionTemplateId,
    rootTemplateId: payload.rootTemplateId ?? templateId,
    supportedProjectTypeId: payload.supportedProjectTypeId,
    supportedGoalTypeIds: payload.supportedGoalTypeIds,
    supportedDeliverableModes: payload.supportedDeliverableModes,
    supportedChannels: payload.supportedChannels,
    supportedIdentityTypeIds: payload.supportedIdentityTypeIds,
    planningMode: payload.planningMode,
    recommendedAgentTemplateIds: payload.recommendedAgentTemplateIds,
    recommendedSkillIds: payload.recommendedSkillIds,
    defaultReviewPolicy: payload.defaultReviewPolicy,
    nodeCount: payload.nodeCount ?? 0,
    createdAt: now(),
    updatedAt: now(),
    applicableGoalTypes: payload.supportedGoalTypeIds,
    applicableDeliverableTypes: payload.supportedDeliverableModes,
  }
  _templates.push(created)
  return created
}

export function updateWorkflowTemplate(
  id: string,
  payload: Partial<WorkflowTemplate>
): WorkflowTemplate | null {
  const idx = _templates.findIndex((t) => t.id === id)
  if (idx < 0) return null
  const current = _templates[idx]
  const next: WorkflowTemplate = {
    ...current,
    ...payload,
    id: current.id,
    scopeType: current.scopeType,
    tenantId: current.scopeType === 'tenant' ? (payload.tenantId ?? current.tenantId) : undefined,
    updatedAt: now(),
  }
  _templates[idx] = next
  return next
}

export function cloneWorkflowTemplateToTenant(
  id: string,
  tenantId: string
): WorkflowTemplate | null {
  const source = getWorkflowTemplateById(id)
  if (!source) return null
  const created = _cloneWorkflowTemplateToTenantCore(source, tenantId)
  cloneNodesToTemplate(id, created.id)
  return created
}

function _cloneWorkflowTemplateToTenantCore(
  source: WorkflowTemplate,
  tenantId: string
): WorkflowTemplate {
  return createWorkflowTemplate({
    name: `${source.name}-租户版`,
    code: `${source.code}_TENANT_${tenantId}`.toUpperCase().slice(0, 64),
    description: source.description,
    type: source.type,
    scopeType: 'tenant' as const,
    tenantId,
    status: 'draft' as const,
    version: 1,
    isLatest: true,
    isSystemPreset: false,
    sourceTemplateId: source.id,
    sourceVersion: source.version,
    clonedFromTemplateId: source.id,
    supportedProjectTypeId: source.supportedProjectTypeId,
    supportedGoalTypeIds: [...source.supportedGoalTypeIds],
    supportedDeliverableModes: [...source.supportedDeliverableModes],
    supportedChannels: source.supportedChannels ? [...source.supportedChannels] : undefined,
    supportedIdentityTypeIds: source.supportedIdentityTypeIds
      ? [...source.supportedIdentityTypeIds]
      : undefined,
    planningMode: source.planningMode,
    recommendedAgentTemplateIds: source.recommendedAgentTemplateIds
      ? [...source.recommendedAgentTemplateIds]
      : undefined,
    recommendedSkillIds: source.recommendedSkillIds ? [...source.recommendedSkillIds] : undefined,
    defaultReviewPolicy: source.defaultReviewPolicy,
    nodeCount: source.nodeCount,
  })
}

export function changeWorkflowTemplateStatus(
  id: string,
  status: WorkflowTemplateStatus
): WorkflowTemplate | null {
  return updateWorkflowTemplate(id, { status })
}

export function deleteWorkflowTemplate(id: string): { success: boolean; reason?: string } {
  const idx = _templates.findIndex((t) => t.id === id)
  if (idx < 0) return { success: false, reason: 'NOT_FOUND' }
  const t = _templates[idx]
  if (t.isSystemPreset) return { success: false, reason: 'SYSTEM_BUILT_IN' }
  _templates.splice(idx, 1)
  return { success: true }
}

/** 兼容旧接口 */
export function getTemplatesByTenantId(tenantId: string): WorkflowTemplate[] {
  return listWorkflowTemplates({ tenantId, page: 1, pageSize: 999 }).items
}

export function getTemplateById(id: string): WorkflowTemplate | null {
  return getWorkflowTemplateById(id)
}

/** 推荐流程模板：按租户、目标类型、交付类型筛选 */
export function getRecommendedTemplates(
  tenantId: string,
  goalTypeCode?: string,
  deliverableType?: string
): WorkflowTemplate[] {
  const { items } = listWorkflowTemplates({
    tenantId,
    status: 'active',
    page: 1,
    pageSize: 50,
    goalType: goalTypeCode && _goalCodeToId(goalTypeCode) ? _goalCodeToId(goalTypeCode)! : undefined,
    deliverableMode:
      deliverableType && _deliverableTypeToMode(deliverableType)
        ? _deliverableTypeToMode(deliverableType)!
        : undefined,
  })
  return items
}

function _goalCodeToId(code: string): string | undefined {
  const map: Record<string, string> = {
    ACCOUNT_FOLLOWERS: 'gt-account-followers',
    ACCOUNT_ENGAGEMENT: 'gt-account-engagement',
    PRIVATE_CONTACTS: 'gt-private-contacts',
    INDEX_COUNT: 'gt-index-count',
    gt_account_followers: 'gt-account-followers',
    gt_account_engagement: 'gt-account-engagement',
  }
  return map[code] ?? (code.startsWith('gt-') ? code : undefined)
}

function _deliverableTypeToMode(type: string): string | undefined {
  const map: Record<string, string | undefined> = {
    content: 'social_content',
    data: 'data_sync',
    leads: 'social_content',
    other: undefined,
  }
  return map[type]
}
