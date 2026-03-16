import { Link } from 'react-router-dom'
import { Card } from '@/components/Card/Card'
import { Table } from '@/components/Table/Table'
import { StatusTag } from '@/components/StatusTag/StatusTag'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import type { ProjectDetailData, ProjectIdentityBindingItem } from '../../../schemas/projectDetail'
import { ROUTES } from '@/core/constants/routes'
import styles from '../tabs.module.css'

export function IdentityConfigTab({ data }: { data: ProjectDetailData }) {
  const { identities } = data
  const list = identities?.list ?? []

  const columns = [
    { key: 'name', title: '身份名称', width: '140px' },
    { key: 'type', title: '身份类型', width: '100px' },
    { key: 'platformLabels', title: '适用平台', width: '140px', render: (_: unknown, r: ProjectIdentityBindingItem) => r.platformLabels ?? '—' },
    {
      key: 'isDefault',
      title: '默认',
      width: '80px',
      render: (_: unknown, r: ProjectIdentityBindingItem) =>
        r.isDefault ? <StatusTag type="success">默认</StatusTag> : '—',
    },
    {
      key: 'action',
      title: '操作',
      width: '180px',
      render: (_: unknown, r: ProjectIdentityBindingItem) => (
        <span className={styles.actionGroup}>
          <Link to={`${ROUTES.TENANT.IDENTITIES}/${r.identityId}`} className={styles.placeholderAction}>
            查看
          </Link>
          {!r.isDefault && (
            <>
              <span className={styles.actionDivider}>|</span>
              {/* eslint-disable-next-line @typescript-eslint/no-empty-function -- 占位 */}
              <button type="button" className={styles.placeholderAction} onClick={() => {}}>
                设为默认（占位）
              </button>
            </>
          )}
          <span className={styles.actionDivider}>|</span>
          {/* eslint-disable-next-line @typescript-eslint/no-empty-function -- 占位 */}
          <button type="button" className={styles.placeholderAction} onClick={() => {}}>
            解绑（占位）
          </button>
        </span>
      ),
    },
  ]

  return (
    <>
      <Card
        title="身份配置说明"
        description="本项目绑定的身份将用于任务执行时的「以谁的身份」表达与发布，支持多身份与默认身份；后续任务创建时可选择本次使用的身份。统一表达口径、区分账号身份，支撑身份矩阵与账号矩阵管理。"
      >
        <p className={styles.emptyHint}>
          在下方添加并管理已绑定身份，可设置一个默认身份；未设置时任务创建将提示选择身份。
        </p>
      </Card>
      <Card title="已绑定身份" description="当前项目绑定的身份列表，可查看详情、设为默认或解绑">
        {/* eslint-disable-next-line @typescript-eslint/no-empty-function -- 占位 */}
        <button type="button" className={styles.placeholderBtn} onClick={() => {}}>
          添加身份（占位）
        </button>
        {list.length === 0 ? (
          <EmptyState
            title="暂无绑定身份"
            description="点击「添加身份」从身份库选择身份绑定到本项目"
          />
        ) : (
          <Table
            columns={columns}
            dataSource={list}
            rowKey="identityId"
            emptyText="暂无绑定身份"
          />
        )}
      </Card>
    </>
  )
}
