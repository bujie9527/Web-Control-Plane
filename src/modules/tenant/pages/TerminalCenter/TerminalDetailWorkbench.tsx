import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PageContainer } from '@/components/PageContainer/PageContainer'
import { StatusTag } from '@/components/StatusTag/StatusTag'
import { Dialog } from '@/components/Dialog/Dialog'
import { listPageStyles } from '@/components/ListPageToolbar/ListPageToolbar'
import { getTerminalById, deleteTerminal, testTerminalById, getRecentTerminalLogs } from '../../services/terminalService'
import { getSystemTerminalTypeList } from '@/modules/platform/services/systemTerminalTypeService'
import { getProjectList } from '../../services/projectService'
import type { TerminalWithIdentity } from '../../services/terminalService'
import type { SystemTerminalType } from '@/modules/platform/schemas/systemTerminalType'
import type { Project } from '../../schemas/project'
import type { TerminalLogItem } from '../../schemas/terminal'
import {
  TERMINAL_STATUS_LABELS as STATUS_LABELS_MAP,
  TERMINAL_TEST_RESULT_LABELS as TEST_RESULT_MAP,
} from '@/core/labels/terminalTypeLabels'
import { ROUTES } from '@/core/constants/routes'
import { OverviewTab } from './tabs/OverviewTab'
import { ConfigCredentialsTab } from './tabs/ConfigCredentialsTab'
import { LinkedProjectsTab } from './tabs/LinkedProjectsTab'
import { BindingIdentityTab } from './tabs/BindingIdentityTab'
import { ExecutionLogTab } from './tabs/ExecutionLogTab'
import styles from './TerminalDetailWorkbench.module.css'


type TabKey = 'overview' | 'config' | 'projects' | 'identity' | 'logs'
const TABS: { key: TabKey; label: string }[] = [
  { key: 'overview', label: '连接概览' },
  { key: 'config', label: '配置与凭证' },
  { key: 'projects', label: '关联项目' },
  { key: 'identity', label: '绑定身份' },
  { key: 'logs', label: '执行日志' },
]

export function TerminalDetailWorkbench() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [terminal, setTerminal] = useState<TerminalWithIdentity | null | undefined>(undefined)
  const [typeMeta, setTypeMeta] = useState<SystemTerminalType | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [logs, setLogs] = useState<TerminalLogItem[]>([])
  const [activeTab, setActiveTab] = useState<TabKey>('overview')
  const [notice, setNotice] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [testing, setTesting] = useState(false)

  const showNotice = (msg: string) => {
    setNotice(msg)
    window.setTimeout(() => setNotice(''), 2500)
  }

  const loadTerminal = () => {
    if (!id) return
    getTerminalById(id).then(setTerminal)
  }

  useEffect(() => {
    if (!id) return
    getTerminalById(id)
      .then((t) => {
        setTerminal(t)
        if (t?.type) {
          getSystemTerminalTypeList({ status: 'active', pageSize: 100 })
            .then((res) => {
              const found = res.items.find((x) => x.code === t.type)
              setTypeMeta(found ?? null)
            })
            .catch(() => setTypeMeta(null))
        }
      })
      .catch(() => setTerminal(null))
  }, [id])

  useEffect(() => {
    getProjectList({ pageSize: 200 }).then((r) => setProjects(r.items))
  }, [])

  useEffect(() => {
    const tenantId = terminal?.tenantId
    if (tenantId) getRecentTerminalLogs(tenantId, 20).then(setLogs)
  }, [terminal?.tenantId])

  if (!id) {
    navigate(ROUTES.TENANT.TERMINALS)
    return null
  }

  if (terminal === undefined) {
    return (
      <PageContainer title="终端详情">
        <p className={styles.loading}>加载中...</p>
      </PageContainer>
    )
  }

  if (terminal === null) {
    return (
      <PageContainer title="终端详情">
        <p className={styles.loading}>未找到该终端。</p>
        <Link to={ROUTES.TENANT.TERMINALS} className={styles.backLink}>← 返回终端列表</Link>
      </PageContainer>
    )
  }

  const handleTest = async () => {
    setTesting(true)
    try {
      await testTerminalById(id!)
      showNotice('测试连接成功')
      loadTerminal()
    } catch (e) {
      showNotice(e instanceof Error ? e.message : '测试连接失败')
    } finally {
      setTesting(false)
    }
  }

  const handleDeleteConfirm = async () => {
    setDeleting(true)
    try {
      await deleteTerminal(id!)
      navigate(ROUTES.TENANT.TERMINALS)
    } catch (e) {
      showNotice(e instanceof Error ? e.message : '删除失败')
      setDeleteOpen(false)
    } finally {
      setDeleting(false)
    }
  }

  const linkedProjectIds = terminal.linkedProjectIds ?? []

  return (
    <PageContainer title={terminal.name} description={`终端 · ${terminal.type}`}>
      {notice && <p className={styles.notice}>{notice}</p>}
      <div className={styles.backBar}>
        <Link to={ROUTES.TENANT.TERMINALS} className={styles.backLink}>← 返回终端列表</Link>
        <span className={styles.breadcrumb}>终端中心 / {terminal.name}</span>
      </div>
      <div className={styles.summaryBar}>
        <div className={styles.summaryLeft}>
          <h1 className={styles.summaryTitle}>{terminal.name}</h1>
          <div className={styles.summaryMeta}>
            <StatusTag type={terminal.status === 'active' ? 'success' : 'warning'}>
              {STATUS_LABELS_MAP[terminal.status] ?? terminal.status}
            </StatusTag>
            <span className={styles.summaryItem}>类型 {typeMeta?.nameZh ?? terminal.type}</span>
            <span className={styles.summaryItem}>
              最后测试 {terminal.lastTestedAt ? TEST_RESULT_MAP[terminal.lastTestResult ?? ''] ?? '—' : '—'}
            </span>
          </div>
        </div>
        <div className={styles.summaryActions}>
          <button type="button" className={listPageStyles.primaryBtn} disabled={testing} onClick={handleTest}>
            {testing ? '测试中…' : '测试连接'}
          </button>
          <button type="button" className={listPageStyles.linkBtn} onClick={() => setNotice('编辑功能可在配置与凭证 Tab 中重新配置')}>
            编辑
          </button>
          <button type="button" className={listPageStyles.linkBtn} style={{ color: '#d93025' }} onClick={() => setDeleteOpen(true)}>
            删除
          </button>
        </div>
      </div>
      <nav className={styles.tabNav}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={activeTab === tab.key ? styles.tabActive : styles.tabItem}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <div className={styles.tabContent}>
        {activeTab === 'overview' && <OverviewTab terminal={terminal} typeMeta={typeMeta} />}
        {activeTab === 'config' && <ConfigCredentialsTab terminal={terminal} onOpenReconfig={() => setNotice('重新配置凭证功能开发中')} />}
        {activeTab === 'projects' && <LinkedProjectsTab projects={projects} linkedProjectIds={linkedProjectIds} />}
        {activeTab === 'identity' && <BindingIdentityTab terminal={terminal} onChangeIdentity={() => setNotice('更换身份功能开发中')} />}
        {activeTab === 'logs' && <ExecutionLogTab logs={logs} />}
      </div>
      {deleteOpen && (
        <Dialog
          open
          onClose={() => setDeleteOpen(false)}
          title="删除确认"
          confirmText={deleting ? '删除中…' : '确认删除'}
          onConfirm={deleting ? undefined : handleDeleteConfirm}
          onCancel={deleting ? undefined : () => setDeleteOpen(false)}
        >
          <p style={{ margin: '0 0 16px', fontSize: 14, color: '#3c4043' }}>
            确定要删除「{terminal.name}」吗？此操作不可撤销。
          </p>
        </Dialog>
      )}
    </PageContainer>
  )
}
