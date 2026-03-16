import { useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/Card/Card'
import { listPageStyles } from '@/components/ListPageToolbar/ListPageToolbar'
import { getTemplateList } from '@/modules/platform/services/agentTemplateService'
import type { AgentTemplate, AgentTemplateRoleType } from '@/modules/platform/schemas/agentTemplate'
import type {
  WorkflowNodeExecutionType,
  WorkflowNodeIntentType,
  WorkflowTemplateNode,
} from '@/modules/tenant/schemas/workflowExecution'
import {
  createNode,
  deleteNode,
  listTemplateNodes,
  reorderNodes,
  updateNode,
} from '@/modules/tenant/services/workflowNodeBuilderService'
import {
  AGENT_ROLE_LABELS,
  EXECUTION_TYPE_LABELS,
  EXECUTOR_STRATEGY_LABELS,
  FIELD_LABELS,
  INTENT_TYPE_LABELS,
} from './workflowTemplateLabels'
import styles from './WorkflowNodeBuilder.module.css'

const executionTypes: WorkflowNodeExecutionType[] = [
  'agent_task',
  'human_review',
  'approval_gate',
  'result_writer',
]
const intentTypes: WorkflowNodeIntentType[] = [
  'create',
  'review',
  'search',
  'research',
  'publish',
  'record',
  'analyze',
  'summarize',
  'classify',
  'reply',
]
const roleTypes: AgentTemplateRoleType[] = [
  'creator',
  'reviewer',
  'publisher',
  'recorder',
  'coordinator',
  'planner',
  'other',
]

const intentSkillHints: Partial<Record<WorkflowNodeIntentType, string[]>> = {
  create: ['write', 'gen', 'create', 'image'],
  review: ['review', 'compliance', 'check'],
  publish: ['publish', 'schedule'],
  record: ['record', 'metrics', 'data'],
  research: ['search', 'research', 'crawl'],
  analyze: ['analyze', 'analysis', 'metrics'],
  summarize: ['summary', 'summarize'],
  classify: ['classify', 'label', 'tag'],
  reply: ['reply', 'respond'],
}

interface WorkflowNodeBuilderProps {
  templateId: string
  /** 租户模式：仅允许编辑节点顺序、Agent/Skill 配置、执行策略、审核策略 */
  tenantMode?: boolean
}

export function WorkflowNodeBuilder({ templateId, tenantMode = false }: WorkflowNodeBuilderProps) {
  const [nodes, setNodes] = useState<WorkflowTemplateNode[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [allAgentTemplates, setAllAgentTemplates] = useState<AgentTemplate[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    const [nodeList, templateList] = await Promise.all([
      listTemplateNodes(templateId),
      getTemplateList({ status: 'active', pageSize: 200 }),
    ])
    const sorted = [...nodeList].sort((a, b) => a.orderIndex - b.orderIndex)
    setNodes(sorted)
    setAllAgentTemplates(templateList.items)
    if (!selectedId && sorted.length > 0) setSelectedId(sorted[0].id)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId])

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedId) ?? null,
    [nodes, selectedId]
  )

  const filteredAgents = useMemo(() => {
    if (!selectedNode) return []
    const roles = selectedNode.allowedAgentRoleTypes ?? []
    if (roles.length === 0) return allAgentTemplates
    return allAgentTemplates.filter((t) => roles.includes(t.roleType))
  }, [selectedNode, allAgentTemplates])

  const filteredSkills = useMemo(() => {
    if (!selectedNode) return []
    const selectedTemplate = allAgentTemplates.find(
      (t) => t.id === selectedNode.recommendedAgentTemplateId
    )
    const raw = selectedTemplate?.supportedSkillIds ?? []
    const hints = intentSkillHints[selectedNode.intentType] ?? []
    if (hints.length === 0) return raw
    return raw.filter((id) => hints.some((h) => id.toLowerCase().includes(h)))
  }, [selectedNode, allAgentTemplates])

  const updateSelectedNodeLocal = (patch: Partial<WorkflowTemplateNode>) => {
    if (!selectedId) return
    setNodes((prev) =>
      prev.map((n) =>
        n.id === selectedId
          ? {
              ...n,
              ...patch,
              templateId: n.templateId,
              workflowTemplateId: n.workflowTemplateId,
              nodeKey: patch.key ?? n.nodeKey,
              nodeName: patch.name ?? n.nodeName,
            }
          : n
      )
    )
  }

  const persistSelected = async () => {
    if (!selectedNode) return
    setSaving(true)
    setError('')
    try {
      await updateNode(selectedNode.id, selectedNode)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const addNode = async () => {
    setSaving(true)
    setError('')
    try {
      const created = await createNode(templateId, {
        key: `node_${Date.now().toString().slice(-6)}`,
        name: `新节点 ${nodes.length + 1}`,
        description: '',
        executionType: 'agent_task',
        intentType: 'create',
        dependsOnNodeIds: [],
        isOptional: false,
        onFailureStrategy: 'stop',
        status: 'enabled',
        orderIndex: nodes.length + 1,
      })
      await load()
      setSelectedId(created.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : '新增失败')
    } finally {
      setSaving(false)
    }
  }

  const removeSelected = async () => {
    if (!selectedNode) return
    setSaving(true)
    setError('')
    try {
      await deleteNode(templateId, selectedNode.id)
      const rest = nodes.filter((n) => n.id !== selectedNode.id)
      setSelectedId(rest[0]?.id ?? null)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : '删除失败')
    } finally {
      setSaving(false)
    }
  }

  const moveSelected = async (direction: 'up' | 'down') => {
    if (!selectedNode) return
    const sorted = [...nodes].sort((a, b) => a.orderIndex - b.orderIndex)
    const idx = sorted.findIndex((n) => n.id === selectedNode.id)
    if (idx < 0) return
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= sorted.length) return
    const swapped = [...sorted]
    ;[swapped[idx], swapped[targetIdx]] = [swapped[targetIdx], swapped[idx]]
    const orderedIds = swapped.map((n) => n.id)
    setSaving(true)
    setError('')
    try {
      await reorderNodes(templateId, orderedIds)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : '排序失败')
    } finally {
      setSaving(false)
    }
  }

  const toggleDependency = (id: string, checked: boolean) => {
    if (!selectedNode) return
    const current = selectedNode.dependsOnNodeIds ?? []
    const next = checked ? [...current, id] : current.filter((x) => x !== id)
    updateSelectedNodeLocal({ dependsOnNodeIds: Array.from(new Set(next)) })
  }

  const toggleRoleType = (role: AgentTemplateRoleType, checked: boolean) => {
    if (!selectedNode) return
    const current = selectedNode.allowedAgentRoleTypes ?? []
    const next = checked ? [...current, role] : current.filter((x) => x !== role)
    updateSelectedNodeLocal({
      allowedAgentRoleTypes: Array.from(new Set(next)),
      recommendedAgentTemplateId: undefined,
      allowedSkillIds: [],
    })
  }

  const toggleSkill = (skillId: string, checked: boolean) => {
    if (!selectedNode) return
    const current = selectedNode.allowedSkillIds ?? []
    const next = checked ? [...current, skillId] : current.filter((x) => x !== skillId)
    updateSelectedNodeLocal({ allowedSkillIds: Array.from(new Set(next)) })
  }

  return (
    <Card
      title={tenantMode ? '节点配置' : '节点构建器'}
      description={tenantMode ? '租户可调整节点顺序及 Agent/Skill/执行策略/审核策略' : '左侧节点列表 / 中间基础信息 / 右侧能力配置'}
    >
      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.layout}>
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <strong>节点列表</strong>
            {!tenantMode && (
              <button type="button" className={listPageStyles.primaryBtn} onClick={addNode} disabled={saving}>
                新增节点
              </button>
            )}
          </div>
          <ul className={styles.nodeList}>
            {[...nodes]
              .sort((a, b) => a.orderIndex - b.orderIndex)
              .map((n) => (
                <li
                  key={n.id}
                  className={`${styles.nodeItem} ${n.id === selectedId ? styles.nodeItemActive : ''}`}
                >
                  <button type="button" className={styles.nodeSelect} onClick={() => setSelectedId(n.id)}>
                    {n.orderIndex}. {n.name}
                  </button>
                </li>
              ))}
          </ul>
          <div className={styles.actions}>
            <button type="button" className={listPageStyles.linkBtn} onClick={() => moveSelected('up')} disabled={!selectedNode || saving}>
              上移
            </button>
            <button type="button" className={listPageStyles.linkBtn} onClick={() => moveSelected('down')} disabled={!selectedNode || saving}>
              下移
            </button>
            {!tenantMode && (
              <button type="button" className={listPageStyles.linkBtn} onClick={removeSelected} disabled={!selectedNode || saving}>
                删除
              </button>
            )}
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeader}><strong>{tenantMode ? '节点信息' : '基础信息'}</strong></div>
          {!selectedNode ? (
            <p className={styles.hint}>请选择节点</p>
          ) : tenantMode ? (
            <p className={styles.hint}>
              {selectedNode.orderIndex}. {selectedNode.name}（{EXECUTION_TYPE_LABELS[selectedNode.executionType]}/{INTENT_TYPE_LABELS[selectedNode.intentType]}）
            </p>
          ) : (
            <>
              <label className={styles.label}>{FIELD_LABELS.key}</label>
              <input className={styles.input} value={selectedNode.key} onChange={(e) => updateSelectedNodeLocal({ key: e.target.value, nodeKey: e.target.value })} />
              <label className={styles.label}>{FIELD_LABELS.name}</label>
              <input className={styles.input} value={selectedNode.name} onChange={(e) => updateSelectedNodeLocal({ name: e.target.value, nodeName: e.target.value })} />
              <label className={styles.label}>{FIELD_LABELS.description}</label>
              <textarea className={styles.textarea} value={selectedNode.description ?? ''} onChange={(e) => updateSelectedNodeLocal({ description: e.target.value })} />

              <label className={styles.label}>{FIELD_LABELS.executionType}</label>
              <select className={styles.select} value={selectedNode.executionType} onChange={(e) => updateSelectedNodeLocal({ executionType: e.target.value as WorkflowNodeExecutionType })}>
                {executionTypes.map((v) => <option key={v} value={v}>{EXECUTION_TYPE_LABELS[v]}</option>)}
              </select>
              <label className={styles.label}>{FIELD_LABELS.intentType}</label>
              <select className={styles.select} value={selectedNode.intentType} onChange={(e) => updateSelectedNodeLocal({ intentType: e.target.value as WorkflowNodeIntentType, allowedSkillIds: [] })}>
                {intentTypes.map((v) => <option key={v} value={v}>{INTENT_TYPE_LABELS[v]}</option>)}
              </select>

              <label className={styles.label}>{FIELD_LABELS.dependsOnNodeIds}</label>
              <div className={styles.checkGrid}>
                {nodes
                  .filter((n) => n.id !== selectedNode.id)
                  .map((n) => (
                    <label key={n.id} className={styles.checkItem}>
                      <input
                        type="checkbox"
                        checked={(selectedNode.dependsOnNodeIds ?? []).includes(n.id)}
                        onChange={(e) => toggleDependency(n.id, e.target.checked)}
                      />
                      <span>{n.name}</span>
                    </label>
                  ))}
              </div>
            </>
          )}
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeader}><strong>能力配置</strong></div>
          {!selectedNode ? (
            <p className={styles.hint}>请选择节点</p>
          ) : (
            <>
              {!tenantMode && (
                <>
                  <label className={styles.label}>{FIELD_LABELS.allowedAgentRoleTypes}</label>
                  <div className={styles.checkGrid}>
                    {roleTypes.map((r) => (
                      <label key={r} className={styles.checkItem}>
                        <input
                          type="checkbox"
                          checked={(selectedNode.allowedAgentRoleTypes ?? []).includes(r)}
                          onChange={(e) => toggleRoleType(r, e.target.checked)}
                        />
                        <span>{AGENT_ROLE_LABELS[r]}</span>
                      </label>
                    ))}
                  </div>
                </>
              )}
              {tenantMode && selectedNode.allowedAgentRoleTypes && selectedNode.allowedAgentRoleTypes.length > 0 && (
                <p className={styles.hint}>角色约束：{selectedNode.allowedAgentRoleTypes.map((r) => AGENT_ROLE_LABELS[r as AgentTemplateRoleType]).join('、')}</p>
              )}

              <label className={styles.label}>{FIELD_LABELS.recommendedAgentTemplateId}（{tenantMode ? '可选' : '按角色过滤'}）</label>
              <select
                className={styles.select}
                value={selectedNode.recommendedAgentTemplateId ?? ''}
                onChange={(e) => {
                  const id = e.target.value || undefined
                  updateSelectedNodeLocal({ recommendedAgentTemplateId: id, allowedSkillIds: [] })
                }}
              >
                <option value="">请选择</option>
                {filteredAgents.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}（{AGENT_ROLE_LABELS[t.roleType]}）
                  </option>
                ))}
              </select>

              <label className={styles.label}>{FIELD_LABELS.allowedSkillIds}（按意图+角色过滤）</label>
              <div className={styles.checkGrid}>
                {filteredSkills.length === 0 ? (
                  <span className={styles.hint}>无可选 Skill</span>
                ) : (
                  filteredSkills.map((s) => (
                    <label key={s} className={styles.checkItem}>
                      <input
                        type="checkbox"
                        checked={(selectedNode.allowedSkillIds ?? []).includes(s)}
                        onChange={(e) => toggleSkill(s, e.target.checked)}
                      />
                      <span>{s}</span>
                    </label>
                  ))
                )}
              </div>

              {!tenantMode && (
                <>
                  <label className={styles.label}>{FIELD_LABELS.inputMapping}（JSON）</label>
                  <textarea
                    className={styles.textarea}
                    value={JSON.stringify(selectedNode.inputMapping ?? {}, null, 2)}
                    onChange={(e) => {
                      try {
                        updateSelectedNodeLocal({ inputMapping: JSON.parse(e.target.value || '{}') })
                      } catch {
                        // ignore invalid json while typing
                      }
                    }}
                  />
                  <label className={styles.label}>{FIELD_LABELS.outputMapping}（JSON）</label>
                  <textarea
                    className={styles.textarea}
                    value={JSON.stringify(selectedNode.outputMapping ?? {}, null, 2)}
                    onChange={(e) => {
                      try {
                        updateSelectedNodeLocal({ outputMapping: JSON.parse(e.target.value || '{}') })
                      } catch {
                        // ignore invalid json while typing
                      }
                    }}
                  />
                </>
              )}
              <label className={styles.label}>{FIELD_LABELS.executorStrategy}</label>
              <select
                className={styles.select}
                value={selectedNode.executorStrategy ?? 'manual'}
                onChange={(e) => updateSelectedNodeLocal({ executorStrategy: e.target.value as WorkflowTemplateNode['executorStrategy'] })}
              >
                <option value="manual">{EXECUTOR_STRATEGY_LABELS.manual}</option>
                <option value="semi_auto">{EXECUTOR_STRATEGY_LABELS.semi_auto}</option>
                <option value="full_auto">{EXECUTOR_STRATEGY_LABELS.full_auto}</option>
              </select>

              <label className={styles.label}>审核策略（节点级，JSON）</label>
              <textarea
                className={styles.textarea}
                value={JSON.stringify(selectedNode.reviewPolicy ?? {}, null, 2)}
                onChange={(e) => {
                  try {
                    updateSelectedNodeLocal({ reviewPolicy: JSON.parse(e.target.value || '{}') })
                  } catch {
                    // ignore invalid json while typing
                  }
                }}
              />

              <div className={styles.actions}>
                <button type="button" className={listPageStyles.primaryBtn} onClick={persistSelected} disabled={saving}>
                  {saving ? '保存中...' : '保存节点'}
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </Card>
  )
}
