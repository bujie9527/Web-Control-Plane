/**
 * 节点 Agent 绑定配置抽屉
 * 仅对 nodeType=agent 的节点生效，配置 Agent 模板、执行策略、Skill 选择与审核策略覆盖
 */
import { useEffect, useState } from 'react'
import { Drawer } from '@/components/Drawer/Drawer'
import { AgentTemplateSelector } from '@/components/AgentTemplateSelector/AgentTemplateSelector'
import { getTemplateById } from '@/modules/platform/services/agentTemplateService'
import { updateTemplateNode } from '../../services/workflowExecutionService'
import type {
  WorkflowTemplateNode,
  ExecutorStrategy,
  ReviewPolicyOverride,
  AgentTemplateSnapshot,
} from '../../schemas/workflowExecution'
import type { AgentTemplate, AgentTemplateRoleType } from '@/modules/platform/schemas/agentTemplate'
import styles from './NodeAgentBindingConfig.module.css'

const executorStrategyLabels: Record<ExecutorStrategy, string> = {
  manual: '人工确认',
  semi_auto: '半自动',
  full_auto: '全自动',
}
const roleTypeLabels: Record<AgentTemplateRoleType, string> = {
  creator: '创作者',
  reviewer: '审核者',
  publisher: '发布者',
  recorder: '记录者',
  coordinator: '协调者',
  supervisor: '执行监督',
  planner: '规划者',
  other: '其他',
}

function formatReviewPolicy(t: AgentTemplate): string {
  const parts: string[] = []
  if (t.requireHumanReview) parts.push('需人工审核')
  if (t.requireNodeReview) parts.push('节点审核')
  if (t.autoApproveWhenConfidenceGte != null)
    parts.push(`置信度≥${t.autoApproveWhenConfidenceGte}可自动通过`)
  return parts.length ? parts.join('；') : '—'
}

function buildTemplateSnapshot(t: AgentTemplate): AgentTemplateSnapshot {
  return {
    id: t.id,
    name: t.name,
    code: t.code,
    roleType: t.roleType,
    defaultModelKey: t.defaultModelKey,
    supportedSkillIds: t.supportedSkillIds ? [...t.supportedSkillIds] : undefined,
    requireHumanReview: t.requireHumanReview,
    requireNodeReview: t.requireNodeReview,
    autoApproveWhenConfidenceGte: t.autoApproveWhenConfidenceGte,
    manual: t.manual,
    semi_auto: t.semi_auto,
    full_auto: t.full_auto,
  }
}

export interface NodeAgentBindingConfigProps {
  open: boolean
  onClose: () => void
  node: WorkflowTemplateNode | null
  onSaved?: () => void
}

export function NodeAgentBindingConfig({ open, onClose, node, onSaved }: NodeAgentBindingConfigProps) {
  const [agentTemplateId, setAgentTemplateId] = useState<string | undefined>(node?.agentTemplateId ?? '')
  const [template, setTemplate] = useState<AgentTemplate | null>(null)
  const [executorStrategy, setExecutorStrategy] = useState<ExecutorStrategy | ''>(
    node?.executorStrategy ?? ''
  )
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>(node?.selectedSkillIds ?? [])
  const [reviewPolicyOverride, setReviewPolicyOverride] = useState<ReviewPolicyOverride>(
    node?.reviewPolicyOverride ?? {}
  )
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // 同步 node 初始值
  useEffect(() => {
    if (node) {
      setAgentTemplateId(node.agentTemplateId ?? '')
      setExecutorStrategy((node.executorStrategy as ExecutorStrategy) ?? '')
      setSelectedSkillIds(node.selectedSkillIds ?? [])
      setReviewPolicyOverride(node.reviewPolicyOverride ?? {})
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- sync from node when node id/fields change, avoid node ref
  }, [node?.id, node?.agentTemplateId, node?.executorStrategy, node?.selectedSkillIds, node?.reviewPolicyOverride])

  // 加载模板详情
  useEffect(() => {
    if (!agentTemplateId) {
      setTemplate(null)
      return
    }
    setLoading(true)
    getTemplateById(agentTemplateId)
      .then(setTemplate)
      .catch(() => setTemplate(null))
      .finally(() => setLoading(false))
  }, [agentTemplateId])

  // 切换模板时重置 selectedSkillIds 为模板支持的交集
  useEffect(() => {
    if (template?.supportedSkillIds) {
      setSelectedSkillIds((prev) =>
        prev.filter((id) => template.supportedSkillIds!.includes(id))
      )
    } else {
      setSelectedSkillIds([])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- only reset when template id changes
  }, [template?.id])

  const allowedStrategies: ExecutorStrategy[] = []
  if (template?.manual) allowedStrategies.push('manual')
  if (template?.semi_auto) allowedStrategies.push('semi_auto')
  if (template?.full_auto) allowedStrategies.push('full_auto')

  const handleSave = async () => {
    if (!node) return
    setError('')
    if (!agentTemplateId || !template) {
      setError('请选择 Agent 模板')
      return
    }
    if (!executorStrategy) {
      setError('请选择执行策略')
      return
    }
    if (allowedStrategies.length > 0 && !allowedStrategies.includes(executorStrategy as ExecutorStrategy)) {
      setError(`执行策略必须在模板允许范围内：${allowedStrategies.map((s) => executorStrategyLabels[s]).join('、')}`)
      return
    }
    // selectedSkillIds 必须在 template.supportedSkillIds 内
    const supported = template.supportedSkillIds ?? []
    const invalid = selectedSkillIds.filter((id) => !supported.includes(id))
    if (invalid.length > 0) {
      setError('所选 Skill 必须在模板支持范围内')
      return
    }

    setSaving(true)
    try {
      const snapshot = buildTemplateSnapshot(template)
      await updateTemplateNode(node.id, {
        agentTemplateId,
        selectedSkillIds: selectedSkillIds.length ? selectedSkillIds : undefined,
        executorStrategy: executorStrategy as ExecutorStrategy,
        reviewPolicyOverride: Object.keys(reviewPolicyOverride).length ? reviewPolicyOverride : undefined,
        templateSnapshot: snapshot,
      })
      onSaved?.()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleSkillToggle = (skillId: string, checked: boolean) => {
    const supported = template?.supportedSkillIds ?? []
    if (!supported.includes(skillId)) return
    setSelectedSkillIds((prev) =>
      checked ? [...prev, skillId] : prev.filter((id) => id !== skillId)
    )
  }

  if (!node || node.nodeType !== 'agent') return null

  const supportedSkills = template?.supportedSkillIds ?? []

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={`配置 Agent：${node.nodeName}`}
      width={520}
    >
      <div className={styles.root}>
        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.section}>
          <label className={styles.label}>Agent 模板 <span className={styles.required}>*</span></label>
          <AgentTemplateSelector
            value={agentTemplateId}
            onChange={(t) => {
              setAgentTemplateId(t?.id ?? '')
              setTemplate(t ?? null)
            }}
          />
        </div>

        {loading && <p className={styles.hint}>加载模板详情...</p>}
        {template && !loading && (
          <>
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>模板信息（只读）</h4>
              <div className={styles.kvGrid}>
                <span className={styles.kvLabel}>模板名称</span>
                <span>{template.name}</span>
                <span className={styles.kvLabel}>角色类型</span>
                <span>{roleTypeLabels[template.roleType]}</span>
                <span className={styles.kvLabel}>默认模型</span>
                <span>{template.defaultModelKey || '—'}</span>
                <span className={styles.kvLabel}>Skill 数量</span>
                <span>{template.supportedSkillIds?.length ?? 0}</span>
                <span className={styles.kvLabel}>审核策略</span>
                <span>{formatReviewPolicy(template)}</span>
              </div>
            </div>

            <div className={styles.section}>
              <label className={styles.label}>执行策略 <span className={styles.required}>*</span></label>
              <select
                className={styles.select}
                value={executorStrategy}
                onChange={(e) => setExecutorStrategy(e.target.value as ExecutorStrategy | '')}
              >
                <option value="">请选择</option>
                {allowedStrategies.map((s) => (
                  <option key={s} value={s}>
                    {executorStrategyLabels[s]}
                  </option>
                ))}
              </select>
              {allowedStrategies.length > 0 && (
                <p className={styles.hint}>
                  可选：{allowedStrategies.map((s) => executorStrategyLabels[s]).join('、')}
                </p>
              )}
            </div>

            {supportedSkills.length > 0 && (
              <div className={styles.section}>
                <label className={styles.label}>启用 Skill（可选，需在模板支持范围内）</label>
                <div className={styles.skillList}>
                  {supportedSkills.map((id) => (
                    <label key={id} className={styles.checkLabel}>
                      <input
                        type="checkbox"
                        checked={selectedSkillIds.includes(id)}
                        onChange={(e) => handleSkillToggle(id, e.target.checked)}
                      />
                      <span>{id}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.section}>
              <label className={styles.label}>审核策略覆盖（可选）</label>
              <div className={styles.checkGroup}>
                <label className={styles.checkLabel}>
                  <input
                    type="checkbox"
                    checked={!!reviewPolicyOverride.requireHumanReview}
                    onChange={(e) =>
                      setReviewPolicyOverride((p) => ({
                        ...p,
                        requireHumanReview: e.target.checked ? true : undefined,
                      }))
                    }
                  />
                  <span>需人工审核</span>
                </label>
                <label className={styles.checkLabel}>
                  <input
                    type="checkbox"
                    checked={!!reviewPolicyOverride.requireNodeReview}
                    onChange={(e) =>
                      setReviewPolicyOverride((p) => ({
                        ...p,
                        requireNodeReview: e.target.checked ? true : undefined,
                      }))
                    }
                  />
                  <span>节点审核</span>
                </label>
              </div>
              <div className={styles.formRow}>
                <label>置信度≥可自动通过</label>
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  placeholder="0.95"
                  value={reviewPolicyOverride.autoApproveWhenConfidenceGte ?? ''}
                  onChange={(e) => {
                    const v = e.target.value
                    const n = v === '' ? undefined : parseFloat(v)
                    setReviewPolicyOverride((p) => ({
                      ...p,
                      autoApproveWhenConfidenceGte: n,
                    }))
                  }}
                />
              </div>
            </div>
          </>
        )}

        <div className={styles.footer}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            取消
          </button>
          <button
            type="button"
            className={styles.saveBtn}
            onClick={handleSave}
            disabled={saving || !agentTemplateId || !template || !executorStrategy}
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </Drawer>
  )
}
