import { Card } from '@/components/Card/Card'
import { StatusTag } from '@/components/StatusTag/StatusTag'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import type { ProjectDetailData } from '../../../schemas/projectDetail'
import type { ProjectSOPStatus } from '../../../schemas/projectDomain'
import styles from '../tabs.module.css'

const SOP_STATUS_LABELS: Record<ProjectSOPStatus, string> = {
  draft: '草稿',
  active: '已启用',
  archived: '已归档',
}

export function ProjectSOPTab({ data }: { data: ProjectDetailData }) {
  const sop = data.projectSOP ?? null

  if (!sop) {
    return (
      <Card
        title="项目 SOP"
        description="本项目「如何做」的自然语言操作说明，可被解析为后续流程与任务（解析结果占位）。"
      >
        <EmptyState title="暂无 SOP" description="后续可在此配置项目操作说明（自然语言），供流程与任务解析使用" />
      </Card>
    )
  }

  return (
    <>
      <Card
        title="项目 SOP"
        description="本项目「如何做」的自然语言操作说明，可被解析为后续流程与任务（解析结果占位）。"
      >
        <div className={styles.kvGrid}>
          <span className={styles.kvLabel}>状态</span>
          <span><StatusTag type={sop.status === 'active' ? 'success' : 'neutral'}>{SOP_STATUS_LABELS[sop.status] ?? sop.status}</StatusTag></span>
          <span className={styles.kvLabel}>版本</span>
          <span>{sop.version}</span>
          <span className={styles.kvLabel}>更新时间</span>
          <span>{sop.updatedAt}</span>
        </div>
        <section className={styles.sopSection}>
          <h4 className={styles.sopSectionTitle}>自然语言 SOP</h4>
          <pre className={styles.sopRaw}>{sop.sopRaw}</pre>
        </section>
        <section className={styles.sopSection}>
          <h4 className={styles.sopSectionTitle}>解析结果（占位）</h4>
          {sop.sopParsed != null && Object.keys(sop.sopParsed).length > 0 ? (
            <pre className={styles.sopParsed}>{JSON.stringify(sop.sopParsed, null, 2)}</pre>
          ) : (
            <p className={styles.emptyHint}>解析结果占位，后续由 Workflow 解析生成。</p>
          )}
        </section>
      </Card>
    </>
  )
}
