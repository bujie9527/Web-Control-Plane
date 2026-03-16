import { useEffect, useState } from 'react'
import type { ProjectCreationFormState } from '../types'
import {
  getProjectTypeByCode,
  getGoalTypeByCode,
  getGoalMetricOptions,
} from '../../../services/projectCreationReferenceService'
import { getIdentityById } from '../../../mock/identityMock'
import { getTerminalList } from '../../../services/terminalService'
import { useAuth } from '@/core/auth/AuthContext'
import styles from '../ProjectCreationWizard.module.css'

const DELIVERABLE_TYPE_LABELS: Record<string, string> = {
  content: '内容',
  leads: '线索',
  data: '数据',
  other: '其他',
}

interface Step7Props {
  form: ProjectCreationFormState
}

export function Step7Confirm({ form }: Step7Props) {
  const { user } = useAuth()
  const tenantId = user?.tenant?.tenantId ?? ''
  const [projectTypeName, setProjectTypeName] = useState('')
  const [goalTypeName, setGoalTypeName] = useState('')
  const [primaryMetricName, setPrimaryMetricName] = useState('')
  const [secondaryMetricNames, setSecondaryMetricNames] = useState<string[]>([])
  const [terminalNames, setTerminalNames] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!form.projectTypeCode) {
      setProjectTypeName('')
      return
    }
    getProjectTypeByCode(form.projectTypeCode).then((p) =>
      setProjectTypeName(p?.name ?? form.projectTypeCode)
    )
  }, [form.projectTypeCode])

  useEffect(() => {
    if (!form.goalTypeCode) {
      setGoalTypeName('')
      return
    }
    getGoalTypeByCode(form.goalTypeCode).then((g) =>
      setGoalTypeName(g?.name ?? form.goalTypeCode)
    )
  }, [form.goalTypeCode])

  useEffect(() => {
    if (!tenantId || form.terminalIds.length === 0) {
      setTerminalNames({})
      return
    }
    getTerminalList({ tenantId, page: 1, pageSize: 100 }).then((res) => {
      const map: Record<string, string> = {}
      res.items.forEach((t) => { map[t.id] = t.name })
      setTerminalNames(map)
    })
  }, [tenantId, form.terminalIds.length])

  useEffect(() => {
    if (!form.primaryMetricCode && form.secondaryMetricCodes.length === 0) {
      setPrimaryMetricName('')
      setSecondaryMetricNames([])
      return
    }
    getGoalMetricOptions().then((list) => {
      const primary = list.find((m) => m.code === form.primaryMetricCode)
      setPrimaryMetricName(primary?.name ?? form.primaryMetricCode)
      const secondary = form.secondaryMetricCodes.map(
        (code) => list.find((m) => m.code === code)?.name ?? code
      )
      setSecondaryMetricNames(secondary)
    })
  }, [form.primaryMetricCode, form.secondaryMetricCodes])

  return (
    <>
      <div className={styles.summaryBlock}>
        <div className={styles.summaryTitle}>项目基础信息</div>
        <div className={styles.summaryContent}>
          <p>名称：{form.name}</p>
          <p>项目类型：{projectTypeName || form.projectTypeCode}</p>
          <p>描述：{form.description || '—'}</p>
        </div>
      </div>
      <div className={styles.summaryBlock}>
        <div className={styles.summaryTitle}>目标建模</div>
        <div className={styles.summaryContent}>
          <p>目标类型：{goalTypeName || form.goalTypeCode}</p>
          <p>目标名称：{form.goalName}</p>
          <p>目标描述：{form.goalDescription}</p>
          <p>主目标指标：{primaryMetricName || form.primaryMetricCode}</p>
          <p>辅助指标：{secondaryMetricNames.join('、') || '—'}</p>
          {form.successCriteria ? <p>成功标准：{form.successCriteria}</p> : null}
          <p>KPI 说明：{form.kpiDefinition || '—'}</p>
        </div>
      </div>
      <div className={styles.summaryBlock}>
        <div className={styles.summaryTitle}>交付标的</div>
        <div className={styles.summaryContent}>
          <p>交付类型：{DELIVERABLE_TYPE_LABELS[form.deliverableType] ?? form.deliverableType}</p>
          <p>交付名称：{form.deliverableName}</p>
          <p>频率：{form.frequency}，目标值：{form.targetValue} {form.unit}</p>
        </div>
      </div>
      <div className={styles.summaryBlock}>
        <div className={styles.summaryTitle}>流程与任务</div>
        <div className={styles.summaryContent}>
          <p>推荐流程模板将根据目标与交付模式在项目中选用。</p>
        </div>
      </div>
      <div className={styles.summaryBlock}>
        <div className={styles.summaryTitle}>Agent 范围</div>
        <div className={styles.summaryContent}>
          <p>
            默认流程规划助手：
            {form.defaultPlannerAgentTemplateId ? form.defaultPlannerAgentTemplateId : '—'}
          </p>
        </div>
      </div>
      <div className={styles.summaryBlock}>
        <div className={styles.summaryTitle}>身份/渠道/资源</div>
        <div className={styles.summaryContent}>
          <p>
            绑定身份：
            {form.identityIds.length > 0
              ? form.identityIds
                  .map((id) => getIdentityById(id)?.name ?? id)
                  .join('、')
              : '—'}
          </p>
          <p>
            默认身份：{form.defaultIdentityId ? getIdentityById(form.defaultIdentityId)?.name ?? form.defaultIdentityId : '—'}
          </p>
          <p>
            绑定终端：
            {form.terminalIds.length > 0
              ? form.terminalIds.map((id) => terminalNames[id] ?? id).join('、')
              : '—'}
          </p>
        </div>
      </div>
      <div className={styles.summaryBlock}>
        <div className={styles.summaryTitle}>预算与审核（SOP）</div>
        <div className={styles.summaryContent} style={{ whiteSpace: 'pre-wrap' }}>
          {form.sopRaw || '—'}
        </div>
      </div>
    </>
  )
}
