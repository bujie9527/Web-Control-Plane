import { useMemo, useState } from 'react'
import { Card } from '@/components/Card/Card'
import { listPageStyles } from '@/components/ListPageToolbar/ListPageToolbar'
import type { WorkflowTemplate } from '@/modules/tenant/schemas/workflowExecution'
import {
  FIELD_LABELS,
  PLANNING_MODE_LABELS,
  SCOPE_TYPE_LABELS,
  WORKFLOW_STATUS_LABELS,
} from './workflowTemplateLabels'
import styles from './WorkflowTemplateFactory.module.css'

type TemplateFormValue = {
  name: string
  code: string
  description: string
  type: string
  scopeType: 'system' | 'tenant'
  tenantId: string
  status: WorkflowTemplate['status']
  isSystemPreset: boolean
  supportedProjectTypeId: string
  supportedGoalTypeIds: string
  supportedDeliverableModes: string
  supportedChannels: string
  supportedIdentityTypeIds: string
  planningMode: WorkflowTemplate['planningMode']
  recommendedAgentTemplateIds: string
  recommendedSkillIds: string
  defaultReviewPolicy: string
  nodeCount: number
  nodeBaseConfig: string
}

export interface WorkflowTemplateFactoryFormProps {
  initial?: WorkflowTemplate | null
  mode: 'new' | 'edit'
  saving?: boolean
  error?: string
  onCancel: () => void
  onSubmit: (payload: Partial<WorkflowTemplate>) => Promise<void>
}

function toCsv(input?: string[]): string {
  return input?.join(',') ?? ''
}

function splitCsv(input: string): string[] {
  return input
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

export function WorkflowTemplateFactoryForm({
  initial,
  mode,
  saving,
  error,
  onCancel,
  onSubmit,
}: WorkflowTemplateFactoryFormProps) {
  const initialNodeDraft = useMemo(
    () =>
      JSON.stringify(
        [
          {
            key: 'create',
            executionType: 'agent_task',
            intentType: 'create',
            recommendedAgentTemplateId: '',
            allowedSkillIds: [],
            inputMapping: {},
            outputMapping: {},
            executorStrategy: 'semi_auto',
          },
        ],
        null,
        2
      ),
    []
  )
  const [form, setForm] = useState<TemplateFormValue>({
    name: initial?.name ?? '',
    code: initial?.code ?? '',
    description: initial?.description ?? '',
    type: initial?.type ?? 'custom',
    scopeType: initial?.scopeType ?? 'system',
    tenantId: initial?.tenantId ?? '',
    status: initial?.status ?? 'draft',
    isSystemPreset: initial?.isSystemPreset ?? false,
    supportedProjectTypeId: initial?.supportedProjectTypeId ?? '',
    supportedGoalTypeIds: toCsv(initial?.supportedGoalTypeIds),
    supportedDeliverableModes: toCsv(initial?.supportedDeliverableModes),
    supportedChannels: toCsv(initial?.supportedChannels),
    supportedIdentityTypeIds: toCsv(initial?.supportedIdentityTypeIds),
    planningMode: initial?.planningMode ?? 'manual',
    recommendedAgentTemplateIds: toCsv(initial?.recommendedAgentTemplateIds),
    recommendedSkillIds: toCsv(initial?.recommendedSkillIds),
    defaultReviewPolicy: initial?.defaultReviewPolicy
      ? JSON.stringify(initial.defaultReviewPolicy, null, 2)
      : '',
    nodeCount: initial?.nodeCount ?? 0,
    nodeBaseConfig: initialNodeDraft,
  })
  const [localError, setLocalError] = useState('')

  const submit = async () => {
    setLocalError('')
    if (!form.name.trim()) return setLocalError('请输入模板名称')
    if (!form.code.trim()) return setLocalError('请输入模板编码')
    if (!form.supportedProjectTypeId.trim()) return setLocalError('请输入项目类型 ID')
    const goals = splitCsv(form.supportedGoalTypeIds)
    const modes = splitCsv(form.supportedDeliverableModes)
    if (goals.length === 0) return setLocalError('至少一个目标类型 ID')
    if (modes.length === 0) return setLocalError('至少一个交付模式')

    let reviewPolicy: Record<string, unknown> | undefined
    if (form.defaultReviewPolicy.trim()) {
      try {
        reviewPolicy = JSON.parse(form.defaultReviewPolicy)
      } catch {
        return setLocalError('默认审核策略必须是合法 JSON')
      }
    }
    await onSubmit({
      name: form.name.trim(),
      code: form.code.trim().toUpperCase().replace(/\s+/g, '_'),
      description: form.description.trim() || undefined,
      type: form.type.trim() || 'custom',
      scopeType: form.scopeType,
      tenantId: form.scopeType === 'tenant' ? form.tenantId.trim() : undefined,
      status: form.status,
      isSystemPreset: form.isSystemPreset,
      supportedProjectTypeId: form.supportedProjectTypeId.trim(),
      supportedGoalTypeIds: goals,
      supportedDeliverableModes: modes,
      supportedChannels: splitCsv(form.supportedChannels),
      supportedIdentityTypeIds: splitCsv(form.supportedIdentityTypeIds),
      planningMode: form.planningMode,
      recommendedAgentTemplateIds: splitCsv(form.recommendedAgentTemplateIds),
      recommendedSkillIds: splitCsv(form.recommendedSkillIds),
      defaultReviewPolicy: reviewPolicy,
      nodeCount: Number(form.nodeCount) || 0,
      applicableGoalTypes: goals,
      applicableDeliverableTypes: modes,
    })
  }

  return (
    <>
      {(error || localError) && <p className={styles.formError}>{error || localError}</p>}
      <Card title="基础信息" description="流程模板工厂对象基础身份">
        <div className={styles.formRow}>
          <label>名称</label>
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </div>
        <div className={styles.formRow}>
          <label>编码</label>
          <input value={form.code} disabled={mode === 'edit'} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />
        </div>
        <div className={styles.formRow}>
          <label>描述</label>
          <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
        </div>
      </Card>

      <Card title="作用域与状态" description="系统 / 租户 两层体系 + 生命周期">
        <div className={styles.formRow}>
          <label>{FIELD_LABELS.scopeType}</label>
          <select value={form.scopeType} onChange={(e) => setForm((f) => ({ ...f, scopeType: e.target.value as 'system' | 'tenant' }))}>
            <option value="system">{SCOPE_TYPE_LABELS.system}</option>
            <option value="tenant">{SCOPE_TYPE_LABELS.tenant}</option>
          </select>
        </div>
        {form.scopeType === 'tenant' && (
          <div className={styles.formRow}>
            <label>{FIELD_LABELS.tenantId}</label>
            <input value={form.tenantId} onChange={(e) => setForm((f) => ({ ...f, tenantId: e.target.value }))} />
          </div>
        )}
        <div className={styles.formRow}>
          <label>{FIELD_LABELS.status}</label>
          <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as WorkflowTemplate['status'] }))}>
            <option value="draft">{WORKFLOW_STATUS_LABELS.draft}</option>
            <option value="active">{WORKFLOW_STATUS_LABELS.active}</option>
            <option value="deprecated">{WORKFLOW_STATUS_LABELS.deprecated}</option>
            <option value="archived">{WORKFLOW_STATUS_LABELS.archived}</option>
          </select>
        </div>
      </Card>

      <Card title="项目语义边界" description="支持项目类型、目标类型、交付模式、渠道和身份类型">
        <div className={styles.formRow}>
          <label>{FIELD_LABELS.supportedProjectTypeId}</label>
          <input value={form.supportedProjectTypeId} onChange={(e) => setForm((f) => ({ ...f, supportedProjectTypeId: e.target.value }))} />
        </div>
        <div className={styles.formRow}>
          <label>{FIELD_LABELS.supportedGoalTypeIds}（逗号分隔）</label>
          <input value={form.supportedGoalTypeIds} onChange={(e) => setForm((f) => ({ ...f, supportedGoalTypeIds: e.target.value }))} />
        </div>
        <div className={styles.formRow}>
          <label>{FIELD_LABELS.supportedDeliverableModes}（逗号分隔）</label>
          <input value={form.supportedDeliverableModes} onChange={(e) => setForm((f) => ({ ...f, supportedDeliverableModes: e.target.value }))} />
        </div>
        <div className={styles.formRow}>
          <label>{FIELD_LABELS.supportedChannels}（可选）</label>
          <input value={form.supportedChannels} onChange={(e) => setForm((f) => ({ ...f, supportedChannels: e.target.value }))} />
        </div>
        <div className={styles.formRow}>
          <label>{FIELD_LABELS.supportedIdentityTypeIds}（可选）</label>
          <input value={form.supportedIdentityTypeIds} onChange={(e) => setForm((f) => ({ ...f, supportedIdentityTypeIds: e.target.value }))} />
        </div>
      </Card>

      <Card title="规划模式与推荐能力" description="规划模式、推荐 Agent/Skill 与默认审核策略">
        <div className={styles.formRow}>
          <label>{FIELD_LABELS.planningMode}</label>
          <select value={form.planningMode} onChange={(e) => setForm((f) => ({ ...f, planningMode: e.target.value as WorkflowTemplate['planningMode'] }))}>
            <option value="manual">{PLANNING_MODE_LABELS.manual}</option>
            <option value="ai_assisted">{PLANNING_MODE_LABELS.ai_assisted}</option>
            <option value="hybrid">{PLANNING_MODE_LABELS.hybrid}</option>
          </select>
        </div>
        <div className={styles.formRow}>
          <label>{FIELD_LABELS.recommendedAgentTemplateIds}（逗号分隔）</label>
          <input value={form.recommendedAgentTemplateIds} onChange={(e) => setForm((f) => ({ ...f, recommendedAgentTemplateIds: e.target.value }))} />
        </div>
        <div className={styles.formRow}>
          <label>{FIELD_LABELS.recommendedSkillIds}（逗号分隔）</label>
          <input value={form.recommendedSkillIds} onChange={(e) => setForm((f) => ({ ...f, recommendedSkillIds: e.target.value }))} />
        </div>
        <div className={styles.formRow}>
          <label>{FIELD_LABELS.defaultReviewPolicy}（JSON）</label>
          <textarea value={form.defaultReviewPolicy} onChange={(e) => setForm((f) => ({ ...f, defaultReviewPolicy: e.target.value }))} />
        </div>
        <div className={styles.formRow}>
          <label>{FIELD_LABELS.nodeCount}</label>
          <input type="number" value={form.nodeCount} onChange={(e) => setForm((f) => ({ ...f, nodeCount: Number(e.target.value || 0) }))} />
        </div>
      </Card>

      <Card title="节点基础配置区" description="节点构建器前置结构位（当前阶段不做可视化编排）">
        <div className={styles.formRow}>
          <label>{FIELD_LABELS.nodeBaseConfig}（结构预览）</label>
          <textarea value={form.nodeBaseConfig} onChange={(e) => setForm((f) => ({ ...f, nodeBaseConfig: e.target.value }))} />
        </div>
        <p className={styles.sectionHint}>
          当前仅作为结构预留，不直接写入节点定义；完整节点编排将在后续节点构建器阶段实现。
        </p>
      </Card>

      <Card title="提交" description="保存流程模板工厂对象">
        <div className={styles.formActions}>
          <button type="button" className={listPageStyles.primaryBtn} onClick={submit} disabled={saving}>
            {saving ? '保存中...' : '保存'}
          </button>
          <button type="button" className={listPageStyles.linkBtn} onClick={onCancel}>
            取消
          </button>
        </div>
      </Card>
    </>
  )
}
