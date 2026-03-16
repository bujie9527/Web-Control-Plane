import { Card } from '@/components/Card/Card'
import { Table } from '@/components/Table/Table'
import { StatusTag } from '@/components/StatusTag/StatusTag'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import type { ProjectDetailData } from '../../../schemas/projectDetail'
import type { ProjectGoal, ProjectGoalType, ProjectDeliverable, ProjectDeliverableType } from '../../../schemas/projectDomain'
import styles from '../tabs.module.css'

const GOAL_TYPE_LABELS: Record<ProjectGoalType, string> = {
  growth: '增长',
  brand: '品牌',
  conversion: '转化',
  other: '其他',
}

const DELIVERABLE_TYPE_LABELS: Record<ProjectDeliverableType, string> = {
  content: '内容',
  leads: '线索',
  data: '数据',
  other: '其他',
}

const phaseColumns = [
  { key: 'name', title: '阶段名称', width: '100px' },
  { key: 'dateRange', title: '时间范围', width: '200px' },
  { key: 'description', title: '目标描述', width: '200px' },
  { key: 'status', title: '状态', width: '90px' },
]

const kpiColumns = [
  { key: 'name', title: '指标名称', width: '120px' },
  { key: 'target', title: '目标值', width: '100px' },
  { key: 'current', title: '当前值', width: '100px' },
  { key: 'unit', title: '单位', width: '60px' },
]

const LEGACY_MAX_ROWS = 5

export function GoalsKpiTab({ data }: { data: ProjectDetailData }) {
  const { goals, projectGoals = [], projectDeliverables = [] } = data
  const phaseGoalsList = goals.phaseGoals ?? []
  const kpiDefinitionsList = goals.kpiDefinitions ?? []
  const phaseGoals = phaseGoalsList.slice(0, LEGACY_MAX_ROWS)
  const kpiDefinitions = kpiDefinitionsList.slice(0, LEGACY_MAX_ROWS)

  return (
    <>
      <Card
        title="项目目标"
        description="本项目要达成的业务目标，确认后不宜随意变更。"
      >
        {projectGoals.length === 0 ? (
          <EmptyState title="暂无项目目标" description="后续可在此配置项目要达成的业务目标" />
        ) : (
          <ul className={styles.alertList}>
            {projectGoals.map((g: ProjectGoal) => (
              <li key={g.id} className={styles.goalCardItem}>
                <div className={styles.kvGrid}>
                  <span className={styles.kvLabel}>目标名称</span>
                  <span>{g.goalName}</span>
                  <span className={styles.kvLabel}>类型</span>
                  <span>{GOAL_TYPE_LABELS[g.goalType] ?? g.goalType}</span>
                  {g.isLocked && (
                    <>
                      <span className={styles.kvLabel} />
                      <span><StatusTag type="neutral">已锁定</StatusTag></span>
                    </>
                  )}
                </div>
                <p className={styles.goalDesc}>{g.goalDescription}</p>
                {g.successCriteria && (
                  <p className={styles.emptyHint}>成功标准：{g.successCriteria}</p>
                )}
                {g.kpiDefinition && (
                  <p className={styles.emptyHint}>KPI 定义：{g.kpiDefinition}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card
        title="交付标的"
        description="本项目具体交付什么、频率与目标值。"
      >
        {projectDeliverables.length === 0 ? (
          <EmptyState title="暂无交付标的" description="后续可在此配置项目具体交付内容与目标值" />
        ) : (
          <ul className={styles.alertList}>
            {projectDeliverables.map((d: ProjectDeliverable) => (
              <li key={d.id} className={styles.deliverableCardItem}>
                <div className={styles.kvGrid}>
                  <span className={styles.kvLabel}>交付名称</span>
                  <span>{d.deliverableName}</span>
                  <span className={styles.kvLabel}>类型</span>
                  <span>{DELIVERABLE_TYPE_LABELS[d.deliverableType] ?? d.deliverableType}</span>
                  {d.frequency && (
                    <>
                      <span className={styles.kvLabel}>频率</span>
                      <span>{d.frequency}</span>
                    </>
                  )}
                  {d.targetValue != null && (
                    <>
                      <span className={styles.kvLabel}>目标值</span>
                      <span>{d.targetValue}{d.unit ? ` ${d.unit}` : ''}</span>
                    </>
                  )}
                </div>
                {d.description && <p className={styles.goalDesc}>{d.description}</p>}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className={styles.legacySection}>
        <h4 className={styles.legacySectionTitle}>阶段与KPI（沿用）</h4>
        <Card title="阶段目标" description="分阶段目标与时间范围">
          <Table
            columns={phaseColumns}
            dataSource={phaseGoals}
            rowKey="id"
            emptyText="暂无阶段目标"
          />
          {phaseGoalsList.length > LEGACY_MAX_ROWS && (
            <p className={styles.emptyHint}>仅展示前 {LEGACY_MAX_ROWS} 条，更多见后续迁移。</p>
          )}
        </Card>
        <Card title="核心指标定义" description="指标名称、目标值、当前值">
          <Table
            columns={kpiColumns}
            dataSource={kpiDefinitions}
            rowKey="id"
            emptyText="暂无指标定义"
          />
          {kpiDefinitionsList.length > LEGACY_MAX_ROWS && (
            <p className={styles.emptyHint}>仅展示前 {LEGACY_MAX_ROWS} 条。</p>
          )}
        </Card>
      </div>
    </>
  )
}
