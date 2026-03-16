import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PageContainer } from '@/components/PageContainer/PageContainer'
import { Card } from '@/components/Card/Card'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { StatusTag } from '@/components/StatusTag/StatusTag'
import { ROUTES } from '@/core/constants/routes'
import { listPageStyles } from '@/components/ListPageToolbar/ListPageToolbar'
import { getTemplateNodes } from '@/modules/tenant/services/workflowExecutionService'
import { getWorkflowTemplateById } from '@/modules/tenant/services/workflowTemplateFactoryService'
import type { WorkflowTemplate, WorkflowTemplateNode, WorkflowTemplateStatus } from '@/modules/tenant/schemas/workflowExecution'
import { WorkflowGraphEditor } from '@/modules/workflow-designer'
import {
  EXECUTION_TYPE_LABELS,
  FIELD_LABELS,
  INTENT_TYPE_LABELS,
  PLANNING_MODE_LABELS,
  WORKFLOW_STATUS_LABELS,
} from './workflowTemplateLabels'
import { TEMPLATE_VERSION_FIELD_LABELS } from '@/core/labels/planningDisplayLabels'
import styles from './WorkflowTemplateFactory.module.css'

const statusMap: Record<WorkflowTemplateStatus, 'success' | 'warning' | 'error' | 'neutral'> = {
  draft: 'neutral',
  active: 'success',
  deprecated: 'warning',
  archived: 'error',
  inactive: 'warning',
}

export function WorkflowTemplateFactoryDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [detail, setDetail] = useState<WorkflowTemplate | null | undefined>(undefined)
  const [nodes, setNodes] = useState<WorkflowTemplateNode[]>([])

  useEffect(() => {
    if (!id) return
    getWorkflowTemplateById(id).then((d) => {
      setDetail(d)
      if (d) getTemplateNodes(d.id).then(setNodes)
    })
  }, [id])

  if (!id) {
    navigate(ROUTES.SYSTEM.WORKFLOW_TEMPLATES)
    return null
  }
  if (detail === undefined) {
    return (
      <PageContainer title="流程模板详情" description="加载中...">
        <p className={styles.loading}>加载中...</p>
      </PageContainer>
    )
  }
  if (detail === null) {
    return (
      <PageContainer title="流程模板详情" description="未找到模板">
        <EmptyState title="未找到模板" description="请返回列表重试" />
      </PageContainer>
    )
  }

  const sortedNodes = [...nodes].sort((a, b) => a.orderIndex - b.orderIndex)

  return (
    <PageContainer
      title={detail.name}
      description={`流程模板 · 编码 ${detail.code} · 可编辑`}
    >
      <div className={styles.headerBar}>
        <Link to={ROUTES.SYSTEM.WORKFLOW_TEMPLATES} className={styles.backLink}>← 返回模板列表</Link>
      </div>

      <Card title="基础信息" description="模板身份与生命周期">
        <div className={styles.kvGrid}>
          <span className={styles.kvLabel}>名称</span>
          <span>{detail.name}</span>
          <span className={styles.kvLabel}>编码</span>
          <span>{detail.code}</span>
          <span className={styles.kvLabel}>描述</span>
          <span>{detail.description || '—'}</span>
          <span className={styles.kvLabel}>状态</span>
          <span><StatusTag type={statusMap[detail.status]}>{WORKFLOW_STATUS_LABELS[detail.status]}</StatusTag></span>
          <span className={styles.kvLabel}>版本</span>
          <span>v{detail.version}</span>
          <span className={styles.kvLabel}>节点数量</span>
          <span>{detail.nodeCount}</span>
          <span className={styles.kvLabel}>创建时间</span>
          <span>{detail.createdAt}</span>
          <span className={styles.kvLabel}>更新时间</span>
          <span>{detail.updatedAt}</span>
        </div>
      </Card>

      {!detail.isLatest && (
        <Card title="版本提示" description="">
          <p className={styles.versionHint}>当前模板不是最新版本，建议查看或切换到最新版本以获取最新功能与修复。</p>
        </Card>
      )}

      <Card title="版本信息" description="模板版本治理与规划来源">
        <div className={styles.kvGrid}>
          <span className={styles.kvLabel}>{TEMPLATE_VERSION_FIELD_LABELS.version}</span>
          <span>v{detail.version}</span>
          <span className={styles.kvLabel}>{TEMPLATE_VERSION_FIELD_LABELS.isLatest}</span>
          <span>{detail.isLatest ? '是' : '否'}</span>
          <span className={styles.kvLabel}>{TEMPLATE_VERSION_FIELD_LABELS.previousVersion}</span>
          <span>{detail.previousVersionTemplateId || '—'}</span>
          <span className={styles.kvLabel}>{TEMPLATE_VERSION_FIELD_LABELS.versionGroup}</span>
          <span>{detail.versionGroupId || '—'}</span>
          <span className={styles.kvLabel}>{TEMPLATE_VERSION_FIELD_LABELS.sourceDraft}</span>
          <span>{detail.sourcePlanningDraftId || '—'}</span>
          <span className={styles.kvLabel}>{TEMPLATE_VERSION_FIELD_LABELS.sourceSession}</span>
          <span>{detail.sourcePlanningSessionId || '—'}</span>
        </div>
      </Card>

      <Card title="作用域与来源关系" description="系统/租户 双层治理与复制关系">
        <div className={styles.kvGrid}>
          <span className={styles.kvLabel}>作用域</span>
          <span>{detail.scopeType === 'system' ? '平台模板' : `租户模板（${detail.tenantId || '—'}）`}</span>
          <span className={styles.kvLabel}>系统预设</span>
          <span>{detail.isSystemPreset ? '是' : '否'}</span>
          <span className={styles.kvLabel}>来源模板</span>
          <span>{detail.sourceTemplateId || '—'}</span>
          <span className={styles.kvLabel}>来源版本</span>
          <span>{detail.sourceVersion ? `v${detail.sourceVersion}` : '—'}</span>
          <span className={styles.kvLabel}>复制来源</span>
          <span>{detail.clonedFromTemplateId || '—'}</span>
        </div>
      </Card>

      <Card title="项目语义边界" description="流程模板强绑定项目语义，不改写项目主目标">
        <div className={styles.kvGrid}>
          <span className={styles.kvLabel}>{FIELD_LABELS.supportedProjectTypeId}</span>
          <span>{detail.supportedProjectTypeId}</span>
          <span className={styles.kvLabel}>{FIELD_LABELS.supportedGoalTypeIds}</span>
          <span>{detail.supportedGoalTypeIds.join('、') || '—'}</span>
          <span className={styles.kvLabel}>{FIELD_LABELS.supportedDeliverableModes}</span>
          <span>{detail.supportedDeliverableModes.join('、') || '—'}</span>
          <span className={styles.kvLabel}>{FIELD_LABELS.supportedChannels}</span>
          <span>{detail.supportedChannels?.join('、') || '—'}</span>
          <span className={styles.kvLabel}>{FIELD_LABELS.supportedIdentityTypeIds}</span>
          <span>{detail.supportedIdentityTypeIds?.join('、') || '—'}</span>
          <span className={styles.kvLabel}>{FIELD_LABELS.planningMode}</span>
          <span>{PLANNING_MODE_LABELS[detail.planningMode] ?? detail.planningMode}</span>
        </div>
      </Card>

      <Card title="推荐能力" description="推荐 Agent / Skill 与默认审核策略">
        <div className={styles.kvGrid}>
          <span className={styles.kvLabel}>{FIELD_LABELS.recommendedAgentTemplateIds}</span>
          <span>{detail.recommendedAgentTemplateIds?.join('、') || '—'}</span>
          <span className={styles.kvLabel}>{FIELD_LABELS.recommendedSkillIds}</span>
          <span>{detail.recommendedSkillIds?.join('、') || '—'}</span>
          <span className={styles.kvLabel}>{FIELD_LABELS.defaultReviewPolicy}</span>
          <span>{detail.defaultReviewPolicy ? JSON.stringify(detail.defaultReviewPolicy) : '—'}</span>
        </div>
      </Card>

      <Card title="节点流程图" description="可视化流程结构（只读）">
        {sortedNodes.length === 0 ? (
          <p className={styles.sectionHint}>暂无节点，可从流程规划会话发布或在此模板编辑页配置节点。</p>
        ) : (
          <div style={{ height: 360, minHeight: 200 }}>
            <WorkflowGraphEditor
              nodes={sortedNodes.map((n) => ({
                ...n,
                dependsOnNodeIds: n.dependsOnNodeIds ?? [],
              }))}
              mode="template"
              readOnly
            />
          </div>
        )}
      </Card>

      <Card title="节点摘要列表" description="结构化节点集合">
        {sortedNodes.length === 0 ? (
          <p className={styles.sectionHint}>暂无节点</p>
        ) : (
          <ul className={styles.nodeList}>
            {sortedNodes.map((n) => (
              <li key={n.id}>
                {n.orderIndex}. {n.name}（{EXECUTION_TYPE_LABELS[n.executionType] ?? n.executionType}/{INTENT_TYPE_LABELS[n.intentType] ?? n.intentType}）· Agent 约束：
                {n.recommendedAgentTemplateId || '—'} · Skill 约束：
                {n.allowedSkillIds?.join('、') || '—'}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="操作" description="模板治理操作">
        <div className={styles.formActions}>
          <button
            type="button"
            className={listPageStyles.primaryBtn}
            onClick={() => navigate(ROUTES.SYSTEM.WORKFLOW_TEMPLATES_EDIT(detail.id))}
          >
            编辑模板
          </button>
          <button
            type="button"
            className={listPageStyles.linkBtn}
            onClick={() => navigate(ROUTES.SYSTEM.WORKFLOW_TEMPLATES)}
          >
            返回列表
          </button>
        </div>
      </Card>
    </PageContainer>
  )
}
