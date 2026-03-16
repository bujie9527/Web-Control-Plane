import { useCallback, useEffect, useState } from 'react'
import { Card } from '@/components/Card/Card'
import { Table } from '@/components/Table/Table'
import { StatusTag } from '@/components/StatusTag/StatusTag'
import type { ProjectDetailData } from '../../../schemas/projectDetail'
import { listFacebookPageBindingsByProject } from '../../../mock/facebookPageBindingMock'
import { getIdentityById } from '../../../mock/identityMock'
import type { FacebookPageBinding } from '../../../schemas/facebookPageBinding'
import { ROUTES } from '@/core/constants/routes'
import styles from '../tabs.module.css'

const columns = [
  { key: 'name', title: '终端名称', width: '160px' },
  { key: 'type', title: '类型', width: '90px' },
  { key: 'status', title: '状态', width: '90px', render: (_: unknown, r: { status: string }) => <StatusTag type="success">{r.status}</StatusTag> },
  { key: 'identityName', title: '绑定身份', width: '140px', render: (_: unknown, r: { identityName?: string }) => r.identityName ?? '未绑定，后续可在终端配置中绑定' },
  { key: 'assignedAt', title: '分配时间', width: '110px' },
  { key: 'action', title: '操作', width: '80px', render: () => <span className={styles.placeholderAction}>配置</span> },
]

const fbBindingColumns = [
  { key: 'pageName', title: '主页名称', width: '180px' },
  { key: 'pageId', title: 'Page ID', width: '140px' },
  { key: 'identityName', title: '绑定身份', width: '140px' },
  { key: 'status', title: '状态', width: '90px', render: (_: unknown, r: FacebookPageBinding) => <StatusTag type="success">{r.status === 'active' ? '已绑定' : r.status}</StatusTag> },
]

export function TerminalsTab({ data }: { data: ProjectDetailData }) {
  const { terminals, summary } = data
  const projectId = summary.id
  const isFacebookPageProject = summary.projectTypeCode === 'FACEBOOK_PAGE_OPERATION'
  const [fbBindings, setFbBindings] = useState<Array<FacebookPageBinding & { identityName?: string }>>([])

  const loadFbBindings = useCallback(() => {
    if (!isFacebookPageProject || !projectId) return
    const list = listFacebookPageBindingsByProject(projectId)
    setFbBindings(
      list.map((b) => ({
        ...b,
        identityName: getIdentityById(b.identityId)?.name ?? '—',
      }))
    )
  }, [isFacebookPageProject, projectId])

  useEffect(() => {
    loadFbBindings()
  }, [loadFbBindings])

  return (
    <>
      {isFacebookPageProject && (
        <Card
          title="Facebook 主页绑定"
          description="本项目绑定的 Facebook 公共主页及对应运营身份，用于多主页差异化内容运营"
        >
          {fbBindings.length === 0 ? (
            <p className={styles.emptyHint}>
              暂无绑定主页。在
              <a href={ROUTES.TENANT.FACEBOOK_PAGES} target="_blank" rel="noopener noreferrer">Facebook 主页</a>
              完成授权后，于项目创建时或后续在资源/身份配置中绑定。
            </p>
          ) : (
            <Table columns={fbBindingColumns} dataSource={fbBindings} rowKey="id" emptyText="暂无绑定" />
          )}
        </Card>
      )}
      <Card title="终端列表" description="项目绑定的执行终端">
        <Table columns={columns} dataSource={terminals.list} rowKey="id" emptyText="暂无终端" />
      </Card>
      <Card title="终端说明" description="终端用于执行任务">
        <p className={styles.emptyHint}>终端用于在本项目中执行流程任务（社媒发布、API 拉取、浏览器自动化等），分配与回收将在后续迭代中开放。</p>
      </Card>
    </>
  )
}
