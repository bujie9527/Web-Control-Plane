/**
 * Step4NodeAgentConfig
 * 项目创建向导第四步：节点 Agent 配置
 *
 * 功能：
 * - 仅在 Step3 已选模板（form.selectedWorkflowTemplateId 非空）时出现
 * - 展示所选模板的节点列表
 * - 每个 executionType = 'agent_task' 的节点提供 Agent 选择器
 *   · 仅展示与该节点 allowedAgentRoleTypes 匹配的 active AgentTemplate
 *   · 默认值为节点的 recommendedAgentTemplateId
 * - human_review / approval_gate 节点显示"此节点由人工执行"说明
 * - result_writer 节点仅展示 result_writer 类型 Agent
 * - 全部节点均有默认值，此步骤无强制必填，可直接进入下一步
 * - 确认后将各节点的绑定信息写入 form.nodeAgentBindings
 */

import { useCallback, useEffect, useState } from 'react'
import { Card } from '@/components/Card/Card'
import type { ProjectCreationFormState, NodeAgentBinding } from '../types'
import type { WorkflowTemplateNode } from '@/modules/tenant/schemas/workflowExecution'
import type { AgentTemplate } from '@/modules/platform/schemas/agentTemplate'
import { getTemplateNodes } from '@/modules/tenant/services/workflowExecutionService'
import { getTemplateList } from '@/modules/platform/services/agentTemplateService'
import { getWorkflowTemplateById } from '@/modules/tenant/services/workflowTemplateFactoryService'

// ─── Props ────────────────────────────────────────────────────────────────────

interface Step4NodeAgentConfigProps {
  form: ProjectCreationFormState
  onChange: (partial: Partial<ProjectCreationFormState>) => void
  tenantId: string
}

// ─── 内部类型 ─────────────────────────────────────────────────────────────────

/** 节点 + 当前选中 Agent + 可选 Agent 列表 */
interface NodeConfigRow {
  node: WorkflowTemplateNode
  /** 当前选中的 Agent Template ID */
  selectedAgentTemplateId: string
  /** 该节点可选的 Agent 列表（已按 allowedAgentRoleTypes 过滤） */
  availableAgents: AgentTemplate[]
  /** 是否需要配置 Agent（human_review / approval_gate 节点不需要） */
  needsAgent: boolean
}

// ─── 工具函数 ─────────────────────────────────────────────────────────────────

/**
 * nodeNeedsAgent
 * 判断节点是否需要配置 Agent
 * human_review 和 approval_gate 类型节点不需要
 */
const EXECUTION_TYPE_LABELS: Record<string, string> = {
  agent_task: 'Agent 任务',
  human_review: '人工审核',
  approval_gate: '审批关卡',
  result_writer: '结果记录',
  system_task: '系统任务',
  manual_input: '人工输入',
  branch_decision: '分支决策',
}

const INTENT_TYPE_LABELS: Record<string, string> = {
  create: '创建',
  review: '审核',
  search: '搜索',
  research: '研究',
  publish: '发布',
  record: '记录',
  analyze: '分析',
  summarize: '总结',
  classify: '分类',
  reply: '回复',
}

function nodeNeedsAgent(node: WorkflowTemplateNode): boolean {
  const t = node.executionType
  return t === 'agent_task' || t === 'result_writer'
}

function getExecutionTypeLabel(executionType: string): string {
  return EXECUTION_TYPE_LABELS[executionType] ?? executionType
}

function getIntentTypeLabel(intentType: string): string {
  return INTENT_TYPE_LABELS[intentType] ?? intentType
}

/** 按节点 allowedAgentRoleTypes 过滤出可选 Agent 列表 */
function filterAgentsForNode(
  allAgents: AgentTemplate[],
  node: WorkflowTemplateNode,
): AgentTemplate[] {
  const allowed = node.allowedAgentRoleTypes ?? []
  if (allowed.length === 0) return allAgents
  return allAgents.filter((a) => allowed.includes(a.roleType))
}

// ─── 子组件 ───────────────────────────────────────────────────────────────────

/**
 * NodeConfigCard
 * 单个节点的配置行
 * - 展示节点名称、执行类型、意图类型
 * - 若 needsAgent=true：展示 Agent 选择下拉框（已过滤可选 Agent）+ 推荐标记
 * - 若 needsAgent=false：展示"此节点由人工执行，无需配置 Agent"说明
 */
function NodeConfigCard({
  row,
  onAgentChange,
}: {
  row: NodeConfigRow
  onAgentChange: (nodeId: string, agentTemplateId: string) => void
}) {
  const { node, selectedAgentTemplateId, availableAgents, needsAgent } = row
  const displayName = (id: string) =>
    availableAgents.find((a) => a.id === id)?.nameZh ?? availableAgents.find((a) => a.id === id)?.name ?? id

  return (
    <Card title={`节点 ${node.orderIndex} · ${node.name}`} description="">
      <div style={{ marginBottom: 8, fontSize: 13, color: '#666' }}>
        {getExecutionTypeLabel(node.executionType)}
        {node.executionType === 'agent_task' && (
          <> · {getIntentTypeLabel(node.intentType)}</>
        )}
      </div>
      {needsAgent ? (
        <div>
          <label style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>
            推荐 Agent：{node.recommendedAgentTemplateId ? displayName(node.recommendedAgentTemplateId) : '—'}
          </label>
          <select
            value={selectedAgentTemplateId}
            onChange={(e) => onAgentChange(node.id, e.target.value)}
            style={{ minWidth: 200, padding: '6px 8px' }}
          >
            {availableAgents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nameZh ?? a.name}
                {a.id === node.recommendedAgentTemplateId ? '（推荐）' : ''}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <p style={{ fontSize: 13, color: '#999' }}>此节点由人工执行，无需配置 Agent</p>
      )}
    </Card>
  )
}

// ─── 主组件 ───────────────────────────────────────────────────────────────────

export function Step4NodeAgentConfig({
  form,
  onChange,
  tenantId: _tenantId,
}: Step4NodeAgentConfigProps) {
  /** 节点配置行列表 */
  const [nodeRows, setNodeRows] = useState<NodeConfigRow[]>([])
  /** 加载态 */
  const [loading, setLoading] = useState(true)
  /** 错误信息 */
  const [error, setError] = useState<string | null>(null)

  /**
   * loadNodesAndAgents
   * 1. 根据 form.selectedWorkflowTemplateId 获取模板节点列表
   *    调用：getWorkflowTemplateNodes(templateId)
   * 2. 获取所有 active AgentTemplate 列表
   *    调用：getTemplateList({ status: 'active' })
   * 3. 为每个节点构建 NodeConfigRow：
   *    - 按 allowedAgentRoleTypes 过滤 availableAgents
   *    - selectedAgentTemplateId 初始化为 node.recommendedAgentTemplateId 或 availableAgents[0].id
   * 4. 将初始绑定结果同步到 form.nodeAgentBindings
   */
  const loadNodesAndAgents = useCallback(async () => {
    const templateId = form.selectedWorkflowTemplateId
    if (!templateId) return
    setLoading(true)
    setError(null)
    try {
      const [nodes, agentRes] = await Promise.all([
        getTemplateNodes(templateId),
        getTemplateList({ page: 1, pageSize: 999, status: 'active' }),
      ])
      const allAgents = agentRes.items ?? []
      const sortedNodes = nodes.slice().sort((a, b) => a.orderIndex - b.orderIndex)

      const rows: NodeConfigRow[] = sortedNodes.map((node) => {
        const availableAgents = filterAgentsForNode(allAgents, node)
        const recommended = node.recommendedAgentTemplateId ?? node.agentTemplateId
        const selected =
          recommended && availableAgents.some((a) => a.id === recommended)
            ? recommended
            : availableAgents[0]?.id ?? ''
        return {
          node,
          selectedAgentTemplateId: selected,
          availableAgents,
          needsAgent: nodeNeedsAgent(node),
        }
      })

      setNodeRows(rows)
      const bindings: NodeAgentBinding[] = rows
        .filter((r) => r.needsAgent && r.selectedAgentTemplateId)
        .map((r) => ({
          templateNodeId: r.node.id,
          selectedAgentTemplateId: r.selectedAgentTemplateId,
        }))
      onChange({ nodeAgentBindings: bindings })
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载节点或 Agent 失败')
    } finally {
      setLoading(false)
    }
  }, [form.selectedWorkflowTemplateId, onChange])

  useEffect(() => {
    if (form.selectedWorkflowTemplateId) {
      loadNodesAndAgents()
    }
  }, [loadNodesAndAgents, form.selectedWorkflowTemplateId])

  /**
   * handleAgentChange
   * 用户更改某节点的 Agent 选择
   * - 更新本地 nodeRows state
   * - 同步更新 form.nodeAgentBindings（替换对应 templateNodeId 的记录）
   * @param nodeId - 节点 ID（WorkflowTemplateNode.id）
   * @param agentTemplateId - 新选中的 AgentTemplate ID
   */
  const handleAgentChange = useCallback(
    (nodeId: string, agentTemplateId: string) => {
      setNodeRows((prev) =>
        prev.map((r) =>
          r.node.id === nodeId
            ? { ...r, selectedAgentTemplateId: agentTemplateId }
            : r,
        ),
      )
      onChange({
        nodeAgentBindings: [
          ...(form.nodeAgentBindings ?? []).filter((b) => b.templateNodeId !== nodeId),
          { templateNodeId: nodeId, selectedAgentTemplateId: agentTemplateId },
        ],
      })
    },
    [form.nodeAgentBindings, onChange],
  )

  const [templateName, setTemplateName] = useState<string>('')

  useEffect(() => {
    if (form.selectedWorkflowTemplateId) {
      getWorkflowTemplateById(form.selectedWorkflowTemplateId).then((t) =>
        setTemplateName(t?.name ?? ''),
      )
    }
  }, [form.selectedWorkflowTemplateId])

  if (!form.selectedWorkflowTemplateId) {
    // 未选模板时不应进入此步骤（由向导逻辑保护），但做防御性提示
    return (
      <Card title="节点 Agent 配置">
        <p>请先返回上一步选择流程模板。</p>
      </Card>
    )
  }

  return (
    <div>
      <p style={{ marginBottom: 16, fontSize: 14, color: '#666' }}>
        基于模板：<strong>{templateName || form.selectedWorkflowTemplateId}</strong>
        {nodeRows.length > 0 && `，共 ${nodeRows.length} 个节点`}
      </p>

      {error && (
        <div style={{ marginBottom: 16, padding: 12, background: '#fff2f0', borderRadius: 8, color: '#cf1322' }}>
          {error}
        </div>
      )}

      {loading && <p style={{ color: '#999' }}>加载节点与 Agent 列表中…</p>}

      {!loading && nodeRows.map((row) => (
        <NodeConfigCard key={row.node.id} row={row} onAgentChange={handleAgentChange} />
      ))}

      {!loading && nodeRows.length > 0 && (
        <p style={{ marginTop: 16, fontSize: 13, color: '#999' }}>
          所有节点已有默认值，可直接进入下一步。
        </p>
      )}
    </div>
  )
}
