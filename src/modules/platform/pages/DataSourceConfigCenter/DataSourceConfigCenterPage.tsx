import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/Card/Card'
import { Dialog } from '@/components/Dialog/Dialog'
import { PageContainer } from '@/components/PageContainer/PageContainer'
import { StatusTag } from '@/components/StatusTag/StatusTag'
import { Table } from '@/components/Table/Table'
import { listPageStyles } from '@/components/ListPageToolbar/ListPageToolbar'
import type {
  DataSourceConfig,
  DataSourceCredential,
  DataSourceProvider,
} from '@/modules/platform/schemas/dataSourceCenter'
import {
  addDataSourceConfig,
  addDataSourceCredential,
  addDataSourceProvider,
  deleteDataSourceConfig,
  deleteDataSourceCredential,
  deleteDataSourceProvider,
  editDataSourceConfig,
  editDataSourceCredential,
  editDataSourceProvider,
  listDataSourceConfigs,
  listDataSourceCredentials,
  listDataSourceProviders,
  runDataSourceExecute,
  testDataSourceProvider,
} from '@/modules/platform/services/dataSourceCenterService'
import styles from './DataSourceConfigCenterPage.module.css'

type Notice = { type: 'success' | 'error'; text: string } | null

const PROVIDER_LABELS: Record<string, string> = {
  tavily: 'Tavily 搜索',
  apify: 'Apify 社媒采集',
  jina_reader: 'Jina 内容提取',
  rss: 'RSS 订阅',
}

function statusLabel(status: string) {
  return status === 'active' ? '启用中' : '已停用'
}

export function DataSourceConfigCenterPage() {
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState<Notice>(null)

  const [credentials, setCredentials] = useState<DataSourceCredential[]>([])
  const [providers, setProviders] = useState<DataSourceProvider[]>([])
  const [configs, setConfigs] = useState<DataSourceConfig[]>([])

  const [credentialDialogOpen, setCredentialDialogOpen] = useState(false)
  const [credentialEditing, setCredentialEditing] = useState<DataSourceCredential | null>(null)
  const [credentialError, setCredentialError] = useState('')
  const [credentialForm, setCredentialForm] = useState({
    id: '',
    name: '',
    nameZh: '',
    providerType: 'tavily',
    secret: '',
    status: 'active',
    notes: '',
  })

  const [providerDialogOpen, setProviderDialogOpen] = useState(false)
  const [providerEditing, setProviderEditing] = useState<DataSourceProvider | null>(null)
  const [providerError, setProviderError] = useState('')
  const [providerForm, setProviderForm] = useState({
    id: '',
    name: '',
    nameZh: '',
    providerType: 'tavily',
    baseUrl: '',
    credentialId: '',
    status: 'active',
    notes: '',
  })

  const [configDialogOpen, setConfigDialogOpen] = useState(false)
  const [configEditing, setConfigEditing] = useState<DataSourceConfig | null>(null)
  const [configError, setConfigError] = useState('')
  const [configForm, setConfigForm] = useState({
    id: '',
    providerId: '',
    tenantId: '',
    configJson: '{\n  "region": "global"\n}',
    rateLimitJson: '{\n  "qpm": 60\n}',
    status: 'active',
    notes: '',
  })

  const [executeDialogOpen, setExecuteDialogOpen] = useState(false)
  const [executeProviderId, setExecuteProviderId] = useState('')
  const [executeQuery, setExecuteQuery] = useState('sports news')
  const [executeResult, setExecuteResult] = useState('')
  const [executeError, setExecuteError] = useState('')

  const credentialNameMap = useMemo(
    () =>
      credentials.reduce<Record<string, string>>((acc, item) => {
        acc[item.id] = item.nameZh ?? item.name
        return acc
      }, {}),
    [credentials]
  )

  const showNotice = (next: Notice) => {
    setNotice(next)
    if (!next) return
    window.setTimeout(() => setNotice(null), 2500)
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [cred, prov, conf] = await Promise.all([
        listDataSourceCredentials(),
        listDataSourceProviders(),
        listDataSourceConfigs(),
      ])
      setCredentials(cred)
      setProviders(prov)
      setConfigs(conf)
      if (!executeProviderId && prov.length > 0) {
        setExecuteProviderId(prov[0].id)
      }
    } catch (e) {
      showNotice({ type: 'error', text: e instanceof Error ? e.message : '加载失败' })
    } finally {
      setLoading(false)
    }
  }, [executeProviderId])

  useEffect(() => {
    void load()
  }, [load])

  const credentialColumns = [
    { key: 'nameZh', title: '凭证', width: '180px', render: (_: unknown, r: DataSourceCredential) => r.nameZh ?? r.name },
    { key: 'providerType', title: '类型', width: '120px', render: (_: unknown, r: DataSourceCredential) => PROVIDER_LABELS[r.providerType] ?? r.providerType },
    { key: 'secretMasked', title: '密钥掩码', width: '140px' },
    {
      key: 'status',
      title: '状态',
      width: '100px',
      render: (_: unknown, r: DataSourceCredential) => (
        <StatusTag status={r.status === 'active' ? 'success' : 'neutral'}>{statusLabel(r.status)}</StatusTag>
      ),
    },
    { key: 'notes', title: '备注', width: '200px', render: (_: unknown, r: DataSourceCredential) => r.notes ?? '—' },
    {
      key: 'actions',
      title: '操作',
      width: '150px',
      render: (_: unknown, r: DataSourceCredential) => (
        <span className={styles.actions}>
          <button type="button" className={listPageStyles.linkBtn} onClick={() => openEditCredential(r)}>
            编辑
          </button>
          <button type="button" className={listPageStyles.linkBtn} onClick={() => void handleDeleteCredential(r.id, r.nameZh ?? r.name)}>
            删除
          </button>
        </span>
      ),
    },
  ]

  const providerColumns = [
    { key: 'nameZh', title: 'Provider', width: '180px', render: (_: unknown, r: DataSourceProvider) => r.nameZh ?? r.name },
    { key: 'providerType', title: '类型', width: '120px', render: (_: unknown, r: DataSourceProvider) => PROVIDER_LABELS[r.providerType] ?? r.providerType },
    {
      key: 'credentialId',
      title: '绑定凭证',
      width: '130px',
      render: (_: unknown, r: DataSourceProvider) => (r.credentialId ? credentialNameMap[r.credentialId] ?? r.credentialId : '—'),
    },
    {
      key: 'status',
      title: '状态',
      width: '100px',
      render: (_: unknown, r: DataSourceProvider) => (
        <StatusTag status={r.status === 'active' ? 'success' : 'neutral'}>{statusLabel(r.status)}</StatusTag>
      ),
    },
    { key: 'baseUrl', title: 'Base URL', width: '180px', render: (_: unknown, r: DataSourceProvider) => r.baseUrl ?? '—' },
    {
      key: 'actions',
      title: '操作',
      width: '210px',
      render: (_: unknown, r: DataSourceProvider) => (
        <span className={styles.actions}>
          <button type="button" className={listPageStyles.linkBtn} onClick={() => openEditProvider(r)}>
            编辑
          </button>
          <button type="button" className={listPageStyles.linkBtn} onClick={() => void handleTestProvider(r.id)}>
            测试连接
          </button>
          <button type="button" className={listPageStyles.linkBtn} onClick={() => void handleDeleteProvider(r.id, r.nameZh ?? r.name)}>
            删除
          </button>
        </span>
      ),
    },
  ]

  const configColumns = [
    {
      key: 'providerId',
      title: 'Provider',
      width: '180px',
      render: (_: unknown, r: DataSourceConfig) => providers.find((p) => p.id === r.providerId)?.nameZh ?? r.providerId,
    },
    { key: 'tenantId', title: '租户', width: '120px', render: (_: unknown, r: DataSourceConfig) => r.tenantId ?? 'system' },
    {
      key: 'status',
      title: '状态',
      width: '100px',
      render: (_: unknown, r: DataSourceConfig) => (
        <StatusTag status={r.status === 'active' ? 'success' : 'neutral'}>{statusLabel(r.status)}</StatusTag>
      ),
    },
    { key: 'notes', title: '备注', width: '220px', render: (_: unknown, r: DataSourceConfig) => r.notes ?? '—' },
    {
      key: 'actions',
      title: '操作',
      width: '160px',
      render: (_: unknown, r: DataSourceConfig) => (
        <span className={styles.actions}>
          <button type="button" className={listPageStyles.linkBtn} onClick={() => openEditConfig(r)}>
            编辑
          </button>
          <button type="button" className={listPageStyles.linkBtn} onClick={() => void handleDeleteConfig(r.id)}>
            删除
          </button>
        </span>
      ),
    },
  ]

  function openCreateCredential() {
    setCredentialEditing(null)
    setCredentialError('')
    setCredentialForm({
      id: '',
      name: '',
      nameZh: '',
      providerType: 'tavily',
      secret: '',
      status: 'active',
      notes: '',
    })
    setCredentialDialogOpen(true)
  }

  function openEditCredential(item: DataSourceCredential) {
    setCredentialEditing(item)
    setCredentialError('')
    setCredentialForm({
      id: item.id,
      name: item.name,
      nameZh: item.nameZh ?? '',
      providerType: item.providerType,
      secret: '',
      status: item.status,
      notes: item.notes ?? '',
    })
    setCredentialDialogOpen(true)
  }

  async function handleSubmitCredential() {
    setCredentialError('')
    if (!credentialForm.name.trim()) return setCredentialError('请输入凭证名称')
    if (!credentialEditing && !credentialForm.secret.trim()) return setCredentialError('新建凭证必须填写密钥')
    try {
      if (credentialEditing) {
        await editDataSourceCredential(credentialEditing.id, {
          name: credentialForm.name,
          nameZh: credentialForm.nameZh,
          providerType: credentialForm.providerType,
          status: credentialForm.status as 'active' | 'disabled',
          notes: credentialForm.notes,
          secret: credentialForm.secret.trim() || undefined,
        })
        showNotice({ type: 'success', text: '已更新数据源凭证' })
      } else {
        await addDataSourceCredential({
          id: credentialForm.id.trim() || undefined,
          name: credentialForm.name,
          nameZh: credentialForm.nameZh,
          providerType: credentialForm.providerType,
          secret: credentialForm.secret,
          status: credentialForm.status as 'active' | 'disabled',
          notes: credentialForm.notes,
        })
        showNotice({ type: 'success', text: '已新增数据源凭证' })
      }
      await load()
      setCredentialDialogOpen(false)
    } catch (e) {
      setCredentialError(e instanceof Error ? e.message : '保存失败')
    }
  }

  async function handleDeleteCredential(id: string, name: string) {
    if (!window.confirm(`确定要删除「${name}」吗？此操作不可撤销。`)) return
    try {
      await deleteDataSourceCredential(id)
      showNotice({ type: 'success', text: '已删除凭证' })
      await load()
    } catch (e) {
      showNotice({ type: 'error', text: e instanceof Error ? e.message : '删除失败' })
    }
  }

  function openCreateProvider() {
    setProviderEditing(null)
    setProviderError('')
    setProviderForm({
      id: '',
      name: '',
      nameZh: '',
      providerType: 'tavily',
      baseUrl: '',
      credentialId: '',
      status: 'active',
      notes: '',
    })
    setProviderDialogOpen(true)
  }

  function openEditProvider(item: DataSourceProvider) {
    setProviderEditing(item)
    setProviderError('')
    setProviderForm({
      id: item.id,
      name: item.name,
      nameZh: item.nameZh ?? '',
      providerType: item.providerType,
      baseUrl: item.baseUrl ?? '',
      credentialId: item.credentialId ?? '',
      status: item.status,
      notes: item.notes ?? '',
    })
    setProviderDialogOpen(true)
  }

  async function handleSubmitProvider() {
    setProviderError('')
    if (!providerForm.name.trim()) return setProviderError('请输入 Provider 名称')
    try {
      if (providerEditing) {
        await editDataSourceProvider(providerEditing.id, {
          name: providerForm.name,
          nameZh: providerForm.nameZh,
          providerType: providerForm.providerType,
          baseUrl: providerForm.baseUrl,
          credentialId: providerForm.credentialId || undefined,
          status: providerForm.status as 'active' | 'disabled',
          notes: providerForm.notes,
        })
        showNotice({ type: 'success', text: '已更新 Provider' })
      } else {
        await addDataSourceProvider({
          id: providerForm.id.trim() || undefined,
          name: providerForm.name,
          nameZh: providerForm.nameZh,
          providerType: providerForm.providerType,
          baseUrl: providerForm.baseUrl,
          credentialId: providerForm.credentialId || undefined,
          status: providerForm.status as 'active' | 'disabled',
          notes: providerForm.notes,
        })
        showNotice({ type: 'success', text: '已新增 Provider' })
      }
      await load()
      setProviderDialogOpen(false)
    } catch (e) {
      setProviderError(e instanceof Error ? e.message : '保存失败')
    }
  }

  async function handleDeleteProvider(id: string, name: string) {
    if (!window.confirm(`确定要删除「${name}」吗？此操作不可撤销。`)) return
    try {
      await deleteDataSourceProvider(id)
      showNotice({ type: 'success', text: '已删除 Provider' })
      await load()
    } catch (e) {
      showNotice({ type: 'error', text: e instanceof Error ? e.message : '删除失败' })
    }
  }

  async function handleTestProvider(id: string) {
    try {
      const result = await testDataSourceProvider(id)
      showNotice({ type: result.ok ? 'success' : 'error', text: result.messageZh })
    } catch (e) {
      showNotice({ type: 'error', text: e instanceof Error ? e.message : '测试失败' })
    }
  }

  function openCreateConfig() {
    setConfigEditing(null)
    setConfigError('')
    setConfigForm({
      id: '',
      providerId: providers[0]?.id ?? '',
      tenantId: '',
      configJson: '{\n  "region": "global"\n}',
      rateLimitJson: '{\n  "qpm": 60\n}',
      status: 'active',
      notes: '',
    })
    setConfigDialogOpen(true)
  }

  function openEditConfig(item: DataSourceConfig) {
    setConfigEditing(item)
    setConfigError('')
    setConfigForm({
      id: item.id,
      providerId: item.providerId,
      tenantId: item.tenantId ?? '',
      configJson: item.configJson ?? '{}',
      rateLimitJson: item.rateLimitJson ?? '{}',
      status: item.status,
      notes: item.notes ?? '',
    })
    setConfigDialogOpen(true)
  }

  async function handleSubmitConfig() {
    setConfigError('')
    if (!configForm.providerId) return setConfigError('请选择 Provider')
    try {
      if (configEditing) {
        await editDataSourceConfig(configEditing.id, {
          providerId: configForm.providerId,
          tenantId: configForm.tenantId || undefined,
          configJson: configForm.configJson,
          rateLimitJson: configForm.rateLimitJson,
          status: configForm.status as 'active' | 'disabled',
          notes: configForm.notes,
        })
        showNotice({ type: 'success', text: '已更新配置' })
      } else {
        await addDataSourceConfig({
          id: configForm.id.trim() || undefined,
          providerId: configForm.providerId,
          tenantId: configForm.tenantId || undefined,
          configJson: configForm.configJson,
          rateLimitJson: configForm.rateLimitJson,
          status: configForm.status as 'active' | 'disabled',
          notes: configForm.notes,
        })
        showNotice({ type: 'success', text: '已新增配置' })
      }
      await load()
      setConfigDialogOpen(false)
    } catch (e) {
      setConfigError(e instanceof Error ? e.message : '保存失败')
    }
  }

  async function handleDeleteConfig(id: string) {
    if (!window.confirm('确定要删除该配置吗？此操作不可撤销。')) return
    try {
      await deleteDataSourceConfig(id)
      showNotice({ type: 'success', text: '已删除配置' })
      await load()
    } catch (e) {
      showNotice({ type: 'error', text: e instanceof Error ? e.message : '删除失败' })
    }
  }

  async function handleRunExecute() {
    setExecuteError('')
    setExecuteResult('')
    if (!executeProviderId || !executeQuery.trim()) {
      setExecuteError('请先选择 Provider 并填写查询词')
      return
    }
    try {
      const result = await runDataSourceExecute({
        providerId: executeProviderId,
        query: executeQuery.trim(),
        limit: 3,
      })
      setExecuteResult(JSON.stringify(result, null, 2))
    } catch (e) {
      setExecuteError(e instanceof Error ? e.message : '执行失败')
    }
  }

  return (
    <PageContainer title="数据源配置中心" description="统一治理 DataSource Provider、凭证和配置，并提供统一执行器联调入口。">
      {notice && (
        <p className={[styles.notice, notice.type === 'success' ? styles.success : styles.error].join(' ')}>
          {notice.text}
        </p>
      )}

      <div className={styles.sections}>
        <Card title="数据源凭证">
          <Table dataSource={credentials} columns={credentialColumns} rowKey="id" loading={loading} />
          <div className={styles.toolbar}>
            <button type="button" className={styles.primaryBtn} onClick={openCreateCredential}>
              新增凭证
            </button>
          </div>
        </Card>

        <Card title="数据源 Provider">
          <Table dataSource={providers} columns={providerColumns} rowKey="id" loading={loading} />
          <div className={styles.toolbar}>
            <button type="button" className={styles.primaryBtn} onClick={openCreateProvider}>
              新增 Provider
            </button>
          </div>
        </Card>

        <Card title="数据源配置">
          <Table dataSource={configs} columns={configColumns} rowKey="id" loading={loading} />
          <div className={styles.toolbar}>
            <button type="button" className={styles.primaryBtn} onClick={openCreateConfig}>
              新增配置
            </button>
            <button type="button" className={styles.ghostBtn} onClick={() => setExecuteDialogOpen(true)}>
              统一执行器联调
            </button>
          </div>
        </Card>
      </div>

      <Dialog
        open={credentialDialogOpen}
        onClose={() => setCredentialDialogOpen(false)}
        title={credentialEditing ? '编辑数据源凭证' : '新增数据源凭证'}
        width={560}
        footer={
          <div className={styles.footer}>
            <button type="button" className={styles.ghostBtn} onClick={() => setCredentialDialogOpen(false)}>
              取消
            </button>
            <button type="button" className={styles.primaryBtn} onClick={() => void handleSubmitCredential()}>
              提交
            </button>
          </div>
        }
      >
        {credentialError && <p className={[styles.notice, styles.error].join(' ')}>{credentialError}</p>}
        <div className={styles.formGrid}>
          <span className={styles.label}>编码</span>
          <input className={styles.input} value={credentialForm.id} disabled={!!credentialEditing} onChange={(e) => setCredentialForm((p) => ({ ...p, id: e.target.value }))} />
          <span className={styles.label}>名称*</span>
          <input className={styles.input} value={credentialForm.name} onChange={(e) => setCredentialForm((p) => ({ ...p, name: e.target.value }))} />
          <span className={styles.label}>中文名</span>
          <input className={styles.input} value={credentialForm.nameZh} onChange={(e) => setCredentialForm((p) => ({ ...p, nameZh: e.target.value }))} />
          <span className={styles.label}>Provider 类型</span>
          <select className={styles.select} value={credentialForm.providerType} onChange={(e) => setCredentialForm((p) => ({ ...p, providerType: e.target.value }))}>
            <option value="tavily">Tavily</option>
            <option value="apify">Apify</option>
            <option value="jina_reader">Jina Reader</option>
            <option value="rss">RSS</option>
          </select>
          <span className={styles.label}>密钥{credentialEditing ? '（可选更新）' : '*'}</span>
          <input className={styles.input} type="password" value={credentialForm.secret} onChange={(e) => setCredentialForm((p) => ({ ...p, secret: e.target.value }))} placeholder={credentialEditing ? '留空表示不修改' : '输入 API Key/Token'} />
          <span className={styles.label}>状态</span>
          <select className={styles.select} value={credentialForm.status} onChange={(e) => setCredentialForm((p) => ({ ...p, status: e.target.value }))}>
            <option value="active">启用中</option>
            <option value="disabled">已停用</option>
          </select>
          <span className={styles.label}>备注</span>
          <textarea className={styles.textarea} value={credentialForm.notes} onChange={(e) => setCredentialForm((p) => ({ ...p, notes: e.target.value }))} />
        </div>
      </Dialog>

      <Dialog
        open={providerDialogOpen}
        onClose={() => setProviderDialogOpen(false)}
        title={providerEditing ? '编辑数据源 Provider' : '新增数据源 Provider'}
        width={560}
        footer={
          <div className={styles.footer}>
            <button type="button" className={styles.ghostBtn} onClick={() => setProviderDialogOpen(false)}>
              取消
            </button>
            <button type="button" className={styles.primaryBtn} onClick={() => void handleSubmitProvider()}>
              提交
            </button>
          </div>
        }
      >
        {providerError && <p className={[styles.notice, styles.error].join(' ')}>{providerError}</p>}
        <div className={styles.formGrid}>
          <span className={styles.label}>编码</span>
          <input className={styles.input} value={providerForm.id} disabled={!!providerEditing} onChange={(e) => setProviderForm((p) => ({ ...p, id: e.target.value }))} />
          <span className={styles.label}>名称*</span>
          <input className={styles.input} value={providerForm.name} onChange={(e) => setProviderForm((p) => ({ ...p, name: e.target.value }))} />
          <span className={styles.label}>中文名</span>
          <input className={styles.input} value={providerForm.nameZh} onChange={(e) => setProviderForm((p) => ({ ...p, nameZh: e.target.value }))} />
          <span className={styles.label}>Provider 类型</span>
          <select className={styles.select} value={providerForm.providerType} onChange={(e) => setProviderForm((p) => ({ ...p, providerType: e.target.value }))}>
            <option value="tavily">Tavily</option>
            <option value="apify">Apify</option>
            <option value="jina_reader">Jina Reader</option>
            <option value="rss">RSS</option>
          </select>
          <span className={styles.label}>Base URL</span>
          <input className={styles.input} value={providerForm.baseUrl} onChange={(e) => setProviderForm((p) => ({ ...p, baseUrl: e.target.value }))} />
          <span className={styles.label}>绑定凭证</span>
          <select className={styles.select} value={providerForm.credentialId} onChange={(e) => setProviderForm((p) => ({ ...p, credentialId: e.target.value }))}>
            <option value="">无</option>
            {credentials
              .filter((c) => c.providerType === providerForm.providerType || providerForm.providerType === 'rss')
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameZh ?? c.name}
                </option>
              ))}
          </select>
          <span className={styles.label}>状态</span>
          <select className={styles.select} value={providerForm.status} onChange={(e) => setProviderForm((p) => ({ ...p, status: e.target.value }))}>
            <option value="active">启用中</option>
            <option value="disabled">已停用</option>
          </select>
          <span className={styles.label}>备注</span>
          <textarea className={styles.textarea} value={providerForm.notes} onChange={(e) => setProviderForm((p) => ({ ...p, notes: e.target.value }))} />
        </div>
      </Dialog>

      <Dialog
        open={configDialogOpen}
        onClose={() => setConfigDialogOpen(false)}
        title={configEditing ? '编辑数据源配置' : '新增数据源配置'}
        width={700}
        footer={
          <div className={styles.footer}>
            <button type="button" className={styles.ghostBtn} onClick={() => setConfigDialogOpen(false)}>
              取消
            </button>
            <button type="button" className={styles.primaryBtn} onClick={() => void handleSubmitConfig()}>
              提交
            </button>
          </div>
        }
      >
        {configError && <p className={[styles.notice, styles.error].join(' ')}>{configError}</p>}
        <div className={styles.formGrid}>
          <span className={styles.label}>编码</span>
          <input className={styles.input} value={configForm.id} disabled={!!configEditing} onChange={(e) => setConfigForm((p) => ({ ...p, id: e.target.value }))} />
          <span className={styles.label}>Provider*</span>
          <select className={styles.select} value={configForm.providerId} onChange={(e) => setConfigForm((p) => ({ ...p, providerId: e.target.value }))}>
            <option value="">请选择</option>
            {providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nameZh ?? p.name}
              </option>
            ))}
          </select>
          <span className={styles.label}>tenantId（可选）</span>
          <input className={styles.input} value={configForm.tenantId} onChange={(e) => setConfigForm((p) => ({ ...p, tenantId: e.target.value }))} />
          <span className={styles.label}>configJson</span>
          <textarea className={styles.textarea} value={configForm.configJson} onChange={(e) => setConfigForm((p) => ({ ...p, configJson: e.target.value }))} />
          <span className={styles.label}>rateLimitJson</span>
          <textarea className={styles.textarea} value={configForm.rateLimitJson} onChange={(e) => setConfigForm((p) => ({ ...p, rateLimitJson: e.target.value }))} />
          <span className={styles.label}>状态</span>
          <select className={styles.select} value={configForm.status} onChange={(e) => setConfigForm((p) => ({ ...p, status: e.target.value }))}>
            <option value="active">启用中</option>
            <option value="disabled">已停用</option>
          </select>
          <span className={styles.label}>备注</span>
          <textarea className={styles.textarea} value={configForm.notes} onChange={(e) => setConfigForm((p) => ({ ...p, notes: e.target.value }))} />
        </div>
      </Dialog>

      <Dialog
        open={executeDialogOpen}
        onClose={() => setExecuteDialogOpen(false)}
        title="统一执行器联调"
        width={720}
        footer={
          <div className={styles.footer}>
            <button type="button" className={styles.ghostBtn} onClick={() => setExecuteDialogOpen(false)}>
              关闭
            </button>
            <button type="button" className={styles.primaryBtn} onClick={() => void handleRunExecute()}>
              执行
            </button>
          </div>
        }
      >
        {executeError && <p className={[styles.notice, styles.error].join(' ')}>{executeError}</p>}
        <div className={styles.formGrid}>
          <span className={styles.label}>Provider</span>
          <select className={styles.select} value={executeProviderId} onChange={(e) => setExecuteProviderId(e.target.value)}>
            <option value="">请选择</option>
            {providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nameZh ?? p.name}
              </option>
            ))}
          </select>
          <span className={styles.label}>查询词</span>
          <input className={styles.input} value={executeQuery} onChange={(e) => setExecuteQuery(e.target.value)} />
          <span className={styles.label}>执行结果</span>
          <textarea className={styles.textareaLarge} value={executeResult} readOnly placeholder="点击“执行”后显示返回 JSON" />
        </div>
      </Dialog>
    </PageContainer>
  )
}
