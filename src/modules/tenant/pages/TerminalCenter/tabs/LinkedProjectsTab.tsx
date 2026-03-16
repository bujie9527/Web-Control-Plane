import { Card } from '@/components/Card/Card'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import type { Project } from '../../../schemas/project'
import styles from './TerminalDetailTabs.module.css'

interface LinkedProjectsTabProps {
  projects: Project[]
  linkedProjectIds: string[]
}

export function LinkedProjectsTab({ projects, linkedProjectIds }: LinkedProjectsTabProps) {
  const linked = projects.filter((p) => linkedProjectIds.includes(p.id))
  return (
    <Card title="关联项目" description="与该终端关联的项目列表">
      {linked.length === 0 ? (
        <EmptyState title="暂无关联项目" description="可在项目配置中关联本终端" />
      ) : (
        <ul className={styles.list}>
          {linked.map((p) => (
            <li key={p.id} className={styles.listItem}>
              <span className={styles.listName}>{p.name}</span>
              <span className={styles.listMeta}>{p.status ?? ''} · 更新于 {p.updatedAt?.slice(0, 10) ?? '—'}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
