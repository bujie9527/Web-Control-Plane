/**
 * 流程模板节点 Mock（结构化节点）
 */
import type { WorkflowTemplateNode } from '../schemas/workflowExecution'

function buildNode(
  input: Pick<
    WorkflowTemplateNode,
    | 'id'
    | 'workflowTemplateId'
    | 'key'
    | 'name'
    | 'executionType'
    | 'intentType'
    | 'orderIndex'
    | 'dependsOnNodeIds'
    | 'isOptional'
    | 'onFailureStrategy'
    | 'status'
  > &
    Partial<WorkflowTemplateNode>
): WorkflowTemplateNode {
  return {
    id: input.id,
    workflowTemplateId: input.workflowTemplateId,
    key: input.key,
    name: input.name,
    description: input.description,
    executionType: input.executionType,
    intentType: input.intentType,
    orderIndex: input.orderIndex,
    dependsOnNodeIds: input.dependsOnNodeIds,
    recommendedAgentTemplateId: input.recommendedAgentTemplateId,
    allowedAgentRoleTypes: input.allowedAgentRoleTypes,
    allowedSkillIds: input.allowedSkillIds,
    inputMapping: input.inputMapping,
    outputMapping: input.outputMapping,
    executorStrategy: input.executorStrategy,
    reviewPolicy: input.reviewPolicy,
    isOptional: input.isOptional,
    onFailureStrategy: input.onFailureStrategy,
    status: input.status,
    retryPolicy: input.retryPolicy,
    fallbackAgentTemplateIds: input.fallbackAgentTemplateIds,
    fallbackSkillIds: input.fallbackSkillIds,
    supervisorPolicy: input.supervisorPolicy,

    /** 兼容旧版字段 */
    templateId: input.workflowTemplateId,
    nodeKey: input.key,
    nodeName: input.name,
    nodeType: input.nodeType ?? 'agent',
    role: input.role,
    executorType: input.executorType ?? 'agent',
    needReview: input.needReview ?? false,
    nextNodeKey: input.nextNodeKey,
    agentTemplateId: input.agentTemplateId,
    selectedSkillIds: input.selectedSkillIds,
    reviewPolicyOverride: input.reviewPolicyOverride,
    templateSnapshot: input.templateSnapshot,
    createdAt: input.createdAt ?? '2025-03-08',
    updatedAt: input.updatedAt ?? '2025-03-08',
  }
}

const nodesByTemplateId: Record<string, WorkflowTemplateNode[]> = {
  wt1: [
    buildNode({
      id: 'wn1-1',
      workflowTemplateId: 'wt1',
      key: 'step1',
      name: '内容撰写',
      description: '生成初稿',
      executionType: 'agent_task',
      intentType: 'create',
      orderIndex: 1,
      dependsOnNodeIds: [],
      isOptional: false,
      onFailureStrategy: 'manual_retry',
      status: 'enabled',
      nodeType: 'agent',
      role: '撰写',
      executorType: 'agent',
      nextNodeKey: 'step2',
      retryPolicy: {
        enabled: true,
        maxRetryCount: 2,
        retryStrategy: 'same_agent',
        autoRetryEnabled: true,
      },
      fallbackAgentTemplateIds: ['at-facebook-content-creator', 'at-base-content-creator'],
      fallbackSkillIds: ['skill-content-write', 'skill-image-gen'],
      supervisorPolicy: {
        allowSkip: false,
        allowRestartPreviousNode: false,
        allowManualReview: true,
        allowAbortWorkflow: true,
        allowAutoRecovery: true,
      },
    }),
    buildNode({
      id: 'wn1-2',
      workflowTemplateId: 'wt1',
      key: 'step2',
      name: '人工审核',
      description: '合规与质量审核',
      executionType: 'human_review',
      intentType: 'review',
      orderIndex: 2,
      dependsOnNodeIds: ['wn1-1'],
      isOptional: false,
      onFailureStrategy: 'stop',
      status: 'enabled',
      nodeType: 'review',
      executorType: 'human',
      needReview: true,
      nextNodeKey: 'step3',
      supervisorPolicy: {
        allowSkip: false,
        allowRestartPreviousNode: true,
        allowManualReview: true,
        allowAbortWorkflow: true,
        allowAutoRecovery: false,
      },
    }),
    buildNode({
      id: 'wn1-3',
      workflowTemplateId: 'wt1',
      key: 'step3',
      name: '发布执行',
      description: '按渠道发布',
      executionType: 'manual_input',
      intentType: 'publish',
      orderIndex: 3,
      dependsOnNodeIds: ['wn1-2'],
      isOptional: false,
      onFailureStrategy: 'manual_retry',
      status: 'enabled',
      nodeType: 'manual',
      executorType: 'human',
    }),
  ],
  wt2: [
    buildNode({
      id: 'wn2-1',
      workflowTemplateId: 'wt2',
      key: 'step1',
      name: '批量拉取',
      description: '拉取待审内容',
      executionType: 'system_task',
      intentType: 'search',
      orderIndex: 1,
      dependsOnNodeIds: [],
      isOptional: false,
      onFailureStrategy: 'stop',
      status: 'enabled',
      nodeType: 'system',
      executorType: 'system',
      nextNodeKey: 'step2',
    }),
    buildNode({
      id: 'wn2-2',
      workflowTemplateId: 'wt2',
      key: 'step2',
      name: 'Agent 初筛',
      description: '自动合规初筛',
      executionType: 'agent_task',
      intentType: 'classify',
      orderIndex: 2,
      dependsOnNodeIds: ['wn2-1'],
      isOptional: false,
      onFailureStrategy: 'manual_retry',
      status: 'enabled',
      nodeType: 'agent',
      executorType: 'agent',
      nextNodeKey: 'step3',
    }),
    buildNode({
      id: 'wn2-3',
      workflowTemplateId: 'wt2',
      key: 'step3',
      name: '人工抽检',
      description: '抽检通过率',
      executionType: 'human_review',
      intentType: 'review',
      orderIndex: 3,
      dependsOnNodeIds: ['wn2-2'],
      isOptional: false,
      onFailureStrategy: 'stop',
      status: 'enabled',
      nodeType: 'review',
      executorType: 'human',
      needReview: true,
    }),
  ],
  wt3: [
    buildNode({
      id: 'wn3-1',
      workflowTemplateId: 'wt3',
      key: 'step1',
      name: '数据拉取',
      description: '多源拉取',
      executionType: 'system_task',
      intentType: 'search',
      orderIndex: 1,
      dependsOnNodeIds: [],
      isOptional: false,
      onFailureStrategy: 'manual_retry',
      status: 'enabled',
      nodeType: 'system',
      executorType: 'api',
      nextNodeKey: 'step2',
    }),
    buildNode({
      id: 'wn3-2',
      workflowTemplateId: 'wt3',
      key: 'step2',
      name: '清洗入库',
      description: '写入看板',
      executionType: 'result_writer',
      intentType: 'record',
      orderIndex: 2,
      dependsOnNodeIds: ['wn3-1'],
      isOptional: false,
      onFailureStrategy: 'continue',
      status: 'enabled',
      nodeType: 'system',
      executorType: 'system',
    }),
  ],
  'wt-facebook-system': [
    buildNode({
      id: 'wn-fb-sys-1',
      workflowTemplateId: 'wt-facebook-system',
      key: 'create',
      name: '内容生成',
      description: 'Facebook 内容创作',
      executionType: 'agent_task',
      intentType: 'create',
      orderIndex: 1,
      dependsOnNodeIds: [],
      recommendedAgentTemplateId: 'at-facebook-content-creator',
      allowedAgentRoleTypes: ['creator'],
      allowedSkillIds: ['skill-content-write', 'skill-image-gen', 'skill-fb-optimize'],
      executorStrategy: 'semi_auto',
      isOptional: false,
      onFailureStrategy: 'manual_retry',
      status: 'enabled',
      nextNodeKey: 'review',
      nodeType: 'agent',
      role: '创作者',
      executorType: 'agent',
      agentTemplateId: 'at-facebook-content-creator',
      selectedSkillIds: ['skill-content-write', 'skill-image-gen'],
      templateSnapshot: {
        id: 'at-facebook-content-creator',
        name: 'Facebook Content Creator Agent',
        code: 'FB_CONTENT_CREATOR',
        roleType: 'creator',
        defaultModelKey: 'gpt-4',
        supportedSkillIds: ['skill-content-write', 'skill-image-gen', 'skill-fb-optimize'],
        requireHumanReview: true,
        requireNodeReview: false,
        manual: true,
        semi_auto: true,
        full_auto: false,
      },
    }),
    buildNode({
      id: 'wn-fb-sys-2',
      workflowTemplateId: 'wt-facebook-system',
      key: 'review',
      name: '内容审核',
      description: '合规与质量审核',
      executionType: 'agent_task',
      intentType: 'review',
      orderIndex: 2,
      dependsOnNodeIds: ['wn-fb-sys-1'],
      recommendedAgentTemplateId: 'at-content-reviewer',
      allowedAgentRoleTypes: ['reviewer'],
      allowedSkillIds: ['skill-content-review', 'skill-compliance-check'],
      executorStrategy: 'semi_auto',
      reviewPolicy: { requireHumanReview: true, requireNodeReview: true },
      isOptional: false,
      onFailureStrategy: 'stop',
      status: 'enabled',
      nextNodeKey: 'publish',
      nodeType: 'agent',
      role: '审核者',
      executorType: 'agent',
      needReview: true,
      agentTemplateId: 'at-content-reviewer',
      selectedSkillIds: ['skill-content-review', 'skill-compliance-check'],
      templateSnapshot: {
        id: 'at-content-reviewer',
        name: 'Content Reviewer Agent',
        code: 'CONTENT_REVIEWER',
        roleType: 'reviewer',
        defaultModelKey: 'gpt-4',
        supportedSkillIds: ['skill-content-review', 'skill-compliance-check', 'skill-brand-check'],
        requireHumanReview: true,
        requireNodeReview: true,
        autoApproveWhenConfidenceGte: 0.92,
        manual: true,
        semi_auto: true,
        full_auto: false,
      },
    }),
    buildNode({
      id: 'wn-fb-sys-3',
      workflowTemplateId: 'wt-facebook-system',
      key: 'publish',
      name: '发布',
      description: '发布到 Facebook（Mock）',
      executionType: 'agent_task',
      intentType: 'publish',
      orderIndex: 3,
      dependsOnNodeIds: ['wn-fb-sys-2'],
      recommendedAgentTemplateId: 'at-publisher',
      allowedAgentRoleTypes: ['publisher'],
      allowedSkillIds: ['skill-publish'],
      executorStrategy: 'semi_auto',
      isOptional: false,
      onFailureStrategy: 'manual_retry',
      status: 'enabled',
      nextNodeKey: 'record',
      nodeType: 'agent',
      role: '发布者',
      executorType: 'agent',
      agentTemplateId: 'at-publisher',
      selectedSkillIds: ['skill-publish'],
      templateSnapshot: {
        id: 'at-publisher',
        name: 'Publisher Agent',
        code: 'PUBLISHER',
        roleType: 'publisher',
        defaultModelKey: 'gpt-3.5-turbo',
        supportedSkillIds: ['skill-publish', 'skill-schedule'],
        requireHumanReview: true,
        requireNodeReview: false,
        manual: true,
        semi_auto: true,
        full_auto: true,
      },
    }),
    buildNode({
      id: 'wn-fb-sys-4',
      workflowTemplateId: 'wt-facebook-system',
      key: 'record',
      name: '结果记录',
      description: '记录执行结果到项目',
      executionType: 'result_writer',
      intentType: 'record',
      orderIndex: 4,
      dependsOnNodeIds: ['wn-fb-sys-3'],
      recommendedAgentTemplateId: 'at-performance-recorder',
      allowedAgentRoleTypes: ['recorder'],
      allowedSkillIds: ['skill-metrics-write'],
      executorStrategy: 'full_auto',
      isOptional: false,
      onFailureStrategy: 'continue',
      status: 'enabled',
      nodeType: 'agent',
      role: '记录者',
      executorType: 'agent',
      agentTemplateId: 'at-performance-recorder',
      selectedSkillIds: ['skill-metrics-write'],
      templateSnapshot: {
        id: 'at-performance-recorder',
        name: 'Performance Recorder Agent',
        code: 'PERFORMANCE_RECORDER',
        roleType: 'recorder',
        defaultModelKey: 'gpt-3.5-turbo',
        supportedSkillIds: ['skill-data-fetch', 'skill-metrics-write'],
        requireHumanReview: false,
        requireNodeReview: false,
        manual: false,
        semi_auto: true,
        full_auto: true,
      },
    }),
  ],
  'wt-facebook-tenant-t1': [],
  'wt-seo-system': [
    buildNode({
      id: 'wn-seo-1',
      workflowTemplateId: 'wt-seo-system',
      key: 'research',
      name: '关键词研究',
      executionType: 'agent_task',
      intentType: 'research',
      orderIndex: 1,
      dependsOnNodeIds: [],
      isOptional: false,
      onFailureStrategy: 'manual_retry',
      status: 'enabled',
      description: '收集关键词与搜索意图',
      nodeType: 'agent',
      executorType: 'agent',
    }),
    buildNode({
      id: 'wn-seo-2',
      workflowTemplateId: 'wt-seo-system',
      key: 'create',
      name: '内容撰写',
      executionType: 'agent_task',
      intentType: 'create',
      orderIndex: 2,
      dependsOnNodeIds: ['wn-seo-1'],
      isOptional: false,
      onFailureStrategy: 'manual_retry',
      status: 'enabled',
      description: '输出 SEO 文章初稿',
      nodeType: 'agent',
      executorType: 'agent',
    }),
  ],
  /** 兼容旧模板 ID */
  'wt-facebook': [],
}

nodesByTemplateId['wt-facebook-tenant-t1'] = nodesByTemplateId['wt-facebook-system'].map((n) => ({
  ...n,
  id: n.id.replace('-sys-', '-t1-'),
  workflowTemplateId: 'wt-facebook-tenant-t1',
  templateId: 'wt-facebook-tenant-t1',
  updatedAt: '2025-03-08',
}))
nodesByTemplateId['wt-facebook'] = nodesByTemplateId['wt-facebook-system'].map((n) => ({
  ...n,
  id: n.id.replace('-sys-', '-compat-'),
  workflowTemplateId: 'wt-facebook',
  templateId: 'wt-facebook',
  updatedAt: '2025-03-08',
}))

export function getNodesByTemplateId(templateId: string): WorkflowTemplateNode[] {
  return nodesByTemplateId[templateId] ?? []
}

/** 查询引用指定 Agent 模板的 WorkflowTemplateNode（Phase 12.6） */
export function getTemplateNodesReferencingAgent(agentTemplateId: string): Array<{
  nodeId: string
  nodeKey: string
  nodeName: string
  templateId: string
}> {
  const result: Array<{ nodeId: string; nodeKey: string; nodeName: string; templateId: string }> = []
  for (const [tid, nodes] of Object.entries(nodesByTemplateId)) {
    for (const n of nodes) {
      if (n.recommendedAgentTemplateId === agentTemplateId) {
        result.push({
          nodeId: n.id,
          nodeKey: n.key,
          nodeName: n.name,
          templateId: tid,
        })
      }
    }
  }
  return result
}

export function getTemplateNodeById(id: string): WorkflowTemplateNode | null {
  for (const list of Object.values(nodesByTemplateId)) {
    const found = list.find((n) => n.id === id)
    if (found) return found
  }
  return null
}

/** 取模板首节点 nodeKey，用于新建实例的 currentNodeKey */
export function getFirstNodeKeyByTemplateId(templateId: string): string | undefined {
  const nodes = getNodesByTemplateId(templateId)
  if (nodes.length === 0) return undefined
  const sorted = [...nodes].sort((a, b) => a.orderIndex - b.orderIndex)
  return sorted[0]?.nodeKey
}

const now = (): string => new Date().toISOString().slice(0, 10)

/** 更新模板节点 */
export function updateTemplateNode(
  id: string,
  payload: Partial<WorkflowTemplateNode>
): WorkflowTemplateNode | null {
  for (const list of Object.values(nodesByTemplateId)) {
    const idx = list.findIndex((n) => n.id === id)
    if (idx >= 0) {
      const node = list[idx]
      const updated: WorkflowTemplateNode = {
        ...node,
        ...payload,
        id: node.id,
        templateId: node.templateId,
        workflowTemplateId: node.workflowTemplateId,
        key: node.key,
        name: node.name,
        updatedAt: now(),
      }
      list[idx] = updated
      return updated
    }
  }
  return null
}

function nextNodeId(templateId: string): string {
  const list = nodesByTemplateId[templateId] ?? []
  const max = list.reduce((m, n) => {
    const num = parseInt(n.id.replace(/\D/g, ''), 10)
    return Number.isNaN(num) ? m : Math.max(m, num)
  }, 0)
  return `wn-${templateId}-${max + 1}`
}

export function createTemplateNode(
  templateId: string,
  payload: Partial<WorkflowTemplateNode>
): WorkflowTemplateNode {
  if (!nodesByTemplateId[templateId]) nodesByTemplateId[templateId] = []
  const list = nodesByTemplateId[templateId]
  const orderIndex = payload.orderIndex ?? list.length + 1
  const key = payload.key ?? `node_${Date.now()}`
  const name = payload.name ?? '新节点'
  const node = buildNode({
    id: nextNodeId(templateId),
    workflowTemplateId: templateId,
    key,
    name,
    description: payload.description ?? '',
    executionType: payload.executionType ?? 'agent_task',
    intentType: payload.intentType ?? 'create',
    orderIndex,
    dependsOnNodeIds: payload.dependsOnNodeIds ?? [],
    recommendedAgentTemplateId: payload.recommendedAgentTemplateId,
    allowedAgentRoleTypes: payload.allowedAgentRoleTypes,
    allowedSkillIds: payload.allowedSkillIds,
    inputMapping: payload.inputMapping,
    outputMapping: payload.outputMapping,
    executorStrategy: payload.executorStrategy ?? 'manual',
    reviewPolicy: payload.reviewPolicy,
    isOptional: payload.isOptional ?? false,
    onFailureStrategy: payload.onFailureStrategy ?? 'stop',
    status: payload.status ?? 'enabled',
    nodeType: payload.nodeType ?? 'agent',
    executorType: payload.executorType ?? 'agent',
    createdAt: now(),
    updatedAt: now(),
  })
  list.push(node)
  return node
}

export function deleteTemplateNode(id: string): boolean {
  for (const [templateId, list] of Object.entries(nodesByTemplateId)) {
    const idx = list.findIndex((n) => n.id === id)
    if (idx >= 0) {
      list.splice(idx, 1)
      list
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .forEach((n, i) => {
          n.orderIndex = i + 1
          n.updatedAt = now()
        })
      nodesByTemplateId[templateId] = list
      return true
    }
  }
  return false
}

export function reorderTemplateNodes(templateId: string, orderedNodeIds: string[]): WorkflowTemplateNode[] {
  const list = nodesByTemplateId[templateId] ?? []
  const byId = new Map(list.map((n) => [n.id, n]))
  const next: WorkflowTemplateNode[] = []
  orderedNodeIds.forEach((id, idx) => {
    const node = byId.get(id)
    if (!node) return
    node.orderIndex = idx + 1
    node.updatedAt = now()
    next.push(node)
  })
  for (const n of list) {
    if (!next.includes(n)) {
      n.orderIndex = next.length + 1
      n.updatedAt = now()
      next.push(n)
    }
  }
  nodesByTemplateId[templateId] = next
  return next
}

/** 复制模板节点到新模板（用于租户复制平台模板） */
export function cloneNodesToTemplate(
  sourceTemplateId: string,
  targetTemplateId: string
): WorkflowTemplateNode[] {
  const sourceNodes = getNodesByTemplateId(sourceTemplateId)
  if (sourceNodes.length === 0) return []

  const sorted = [...sourceNodes].sort((a, b) => a.orderIndex - b.orderIndex)
  const idMap = new Map<string, string>()
  const result: WorkflowTemplateNode[] = []

  for (let i = 0; i < sorted.length; i++) {
    const src = sorted[i]
    const newId = `wn-clone-${targetTemplateId}-${i + 1}`
    idMap.set(src.id, newId)
  }

  for (let i = 0; i < sorted.length; i++) {
    const src = sorted[i]
    const newId = idMap.get(src.id)!
    const newDependsOn = (src.dependsOnNodeIds ?? [])
      .map((oldId) => idMap.get(oldId))
      .filter((id): id is string => id != null)

    const node = buildNode({
      id: newId,
      workflowTemplateId: targetTemplateId,
      key: src.key,
      name: src.name,
      description: src.description,
      executionType: src.executionType,
      intentType: src.intentType,
      orderIndex: src.orderIndex,
      dependsOnNodeIds: newDependsOn,
      recommendedAgentTemplateId: src.recommendedAgentTemplateId,
      allowedAgentRoleTypes: src.allowedAgentRoleTypes,
      allowedSkillIds: src.allowedSkillIds ? [...src.allowedSkillIds] : undefined,
      inputMapping: src.inputMapping ? { ...src.inputMapping } : undefined,
      outputMapping: src.outputMapping ? { ...src.outputMapping } : undefined,
      executorStrategy: src.executorStrategy,
      reviewPolicy: src.reviewPolicy ? { ...src.reviewPolicy } : undefined,
      isOptional: src.isOptional,
      onFailureStrategy: src.onFailureStrategy,
      status: src.status,
      createdAt: now(),
      updatedAt: now(),
    })
    result.push(node)
  }

  nodesByTemplateId[targetTemplateId] = result
  return result
}

/**
 * 从规划草案转换结果添加节点到模板（Phase 12）
 */
export function addNodesFromDraftConversion(
  templateId: string,
  nodes: Array<
    Omit<WorkflowTemplateNode, 'workflowTemplateId' | 'templateId'> & {
      workflowTemplateId?: string
      templateId?: string
    }
  >
): WorkflowTemplateNode[] {
  const result: WorkflowTemplateNode[] = nodes.map((n) =>
    buildNode({
      ...n,
      id: n.id,
      workflowTemplateId: templateId,
      templateId,
      createdAt: n.createdAt ?? now(),
      updatedAt: n.updatedAt ?? now(),
    })
  )
  nodesByTemplateId[templateId] = result
  return result
}
