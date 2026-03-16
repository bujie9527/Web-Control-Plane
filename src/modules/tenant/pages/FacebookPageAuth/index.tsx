import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { PageContainer } from '@/components/PageContainer/PageContainer'
import { Card } from '@/components/Card/Card'
import { Table } from '@/components/Table/Table'
import { StatusTag } from '@/components/StatusTag/StatusTag'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { listPageStyles } from '@/components/ListPageToolbar/ListPageToolbar'
import { useAuth } from '@/core/auth/AuthContext'
import { ROUTES } from '@/core/constants/routes'
import {
  getFacebookConfigForSDK,
  listFacebookTerminals,
  authorizeWithFBSDK,
  initOAuthRedirect,
} from '@/modules/tenant/services/facebookTerminalService'
import { deleteTerminal } from '@/modules/tenant/services/terminalService'
import type { Terminal } from '@/modules/tenant/schemas/terminal'

const STATUS_MAP: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = {
  active: 'success',
  inactive: 'neutral',
  error: 'error',
  testing: 'warning',
}

const NOT_CONFIGURED_MESSAGE =
  '管理员尚未配置 Facebook 集成，请联系管理员在「平台设置」-「认证配置」中完成配置。'

declare global {
  interface Window {
    FB?: {
      init: (p: { appId: string; cookie?: boolean; xfbml?: boolean; version: string }) => void
      login: (cb: (r: { authResponse?: { accessToken: string } }) => void, opts: { scope: string }) => void
    }
    fbAsyncInit?: () => void
  }
}

function parseConfigJson(configJson: string | undefined): { pageCategory?: string; authorizedAt?: string } {
  if (!configJson?.trim()) return {}
  try {
    return JSON.parse(configJson) as { pageCategory?: string; authorizedAt?: string }
  } catch {
    return {}
  }
}

export function FacebookPageAuth() {
  const { user } = useAuth()
  const tenantId = user?.tenant?.tenantId ?? ''
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [list, setList] = useState<Terminal[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [config, setConfig] = useState<{ appId: string; scopes: string } | null | undefined>(undefined)
  const sdkReady = useRef(false)

  const load = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    setLoadError(null)
    try {
      const res = await listFacebookTerminals(tenantId, { pageSize: 100 })
      setList(res.items)
    } catch (e) {
      const msg = e instanceof Error ? e.message : '获取列表失败'
      setLoadError(msg)
      setList([])
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    const hasCallback = searchParams.get('success') || searchParams.get('oauth_success') || searchParams.get('error')
    if (!hasCallback) load()
  }, [load, searchParams])

  useEffect(() => {
    const success = searchParams.get('success')
    const oauthSuccess = searchParams.get('oauth_success')
    const error = searchParams.get('error')
    const errorDesc = searchParams.get('error_description')
    if (success === '1' || oauthSuccess === '1') {
      setNotice('已用 Facebook 账号授权成功，主页已作为终端添加。')
      setSearchParams({}, { replace: true })
      load()
    } else if (error) {
      setNotice(errorDesc || error || '授权未完成')
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams, load])

  useEffect(() => {
    let cancelled = false
    getFacebookConfigForSDK()
      .then((c) => {
        if (cancelled) return
        setConfig(c ?? null)
        if (!c?.appId) return
        if (window.FB) {
          window.FB.init({ appId: c.appId, cookie: true, xfbml: false, version: 'v21.0' })
          sdkReady.current = true
          return
        }
        window.fbAsyncInit = () => {
          if (window.FB) {
            window.FB.init({ appId: c.appId, cookie: true, xfbml: false, version: 'v21.0' })
            sdkReady.current = true
          }
        }
        const script = document.createElement('script')
        script.src = 'https://connect.facebook.net/zh_CN/sdk.js'
        script.async = true
        script.defer = true
        document.body.appendChild(script)
      })
      .catch(() => setConfig(null))
    return () => { cancelled = true }
  }, [])

  const handleAuth = async () => {
    if (!config?.appId) {
      setNotice(NOT_CONFIGURED_MESSAGE)
      return
    }
    if (!tenantId) {
      setNotice('无法获取当前租户')
      return
    }
    setAuthLoading(true)
    setNotice('')
    const scopes = config.scopes || 'pages_show_list'
    try {
      if (sdkReady.current && window.FB) {
        window.FB.login((response) => {
          const token = response.authResponse?.accessToken
          if (!token) {
            setNotice('未完成登录或已取消')
            setAuthLoading(false)
            return
          }
          authorizeWithFBSDK(tenantId, token)
            .then(({ pageCount }) => {
              setNotice(pageCount > 0 ? `已连接 ${pageCount} 个主页，每个主页已作为终端添加。` : '未找到可管理的主页，请确认你在 Facebook 有公共主页')
              load()
            })
            .catch((e) => setNotice(e instanceof Error ? e.message : '保存失败'))
            .finally(() => setAuthLoading(false))
        }, { scope: scopes })
        return
      }
      await initOAuthRedirect(tenantId)
    } catch (e) {
      const msg = e instanceof Error ? e.message : ''
      setNotice(msg && (msg.includes('未配置') || msg.includes('503')) ? NOT_CONFIGURED_MESSAGE : msg || '请重试或联系管理员完成 Facebook 集成配置')
      setAuthLoading(false)
    }
  }

  const handleDisconnect = async (terminal: Terminal) => {
    if (!window.confirm(`确定要断开主页「${terminal.name}」吗？断开后将无法代表该主页发帖。`)) return
    try {
      await deleteTerminal(terminal.id)
      setNotice('已断开该主页')
      load()
    } catch (e) {
      setNotice(e instanceof Error ? e.message : '断开失败')
    }
  }

  const columns = [
    { key: 'name', title: '主页名称', width: '180px', render: (_: unknown, r: Terminal) => r.name },
    {
      key: 'pageId',
      title: 'Page ID',
      width: '140px',
      render: (_: unknown, r: Terminal) => {
        try {
          const o = r.credentialsJson ? JSON.parse(r.credentialsJson) as { pageId?: string } : {}
          return o.pageId ?? '—'
        } catch {
          return '—'
        }
      },
    },
    {
      key: 'pageCategory',
      title: '分类',
      width: '100px',
      render: (_: unknown, r: Terminal) => parseConfigJson(r.configJson).pageCategory ?? '—',
    },
    {
      key: 'status',
      title: '状态',
      width: '90px',
      render: (_: unknown, r: Terminal) => (
        <StatusTag type={STATUS_MAP[r.status] ?? 'neutral'}>
          {r.status === 'active' ? '已连接' : r.status === 'error' ? '异常' : r.status === 'inactive' ? '未启用' : r.status}
        </StatusTag>
      ),
    },
    {
      key: 'createdAt',
      title: '添加时间',
      width: '160px',
      render: (_: unknown, r: Terminal) => new Date(r.createdAt).toLocaleString('zh-CN'),
    },
    {
      key: 'action',
      title: '操作',
      width: '140px',
      render: (_: unknown, r: Terminal) => (
        <>
          <button
            type="button"
            className={listPageStyles.linkBtn}
            onClick={() => navigate(ROUTES.TENANT.TERMINAL_DETAIL(r.id))}
          >
            查看详情
          </button>
          <button
            type="button"
            className={listPageStyles.linkBtn}
            style={{ color: '#c5221f', marginLeft: 8 }}
            onClick={() => handleDisconnect(r)}
          >
            断开连接
          </button>
        </>
      ),
    },
  ]

  const isSuccessNotice = notice.startsWith('已') || notice.includes('连接') || notice.includes('成功')
  const notConfigured = config === null
  const configLoading = config === undefined
  const showAuthButton = config != null && config.appId

  return (
    <PageContainer
      title="Facebook 主页"
      description="已授权的主页会以终端形式列出，可在终端中心统一管理。点击「连接新主页」授权更多主页。"
    >
      {notice && (
        <p
          style={{
            padding: '8px 16px',
            margin: '0 0 12px',
            background: isSuccessNotice ? '#e6f4ea' : '#fce8e6',
            color: isSuccessNotice ? '#137333' : '#c5221f',
            borderRadius: 4,
            fontSize: 14,
          }}
        >
          {notice}
        </p>
      )}
      <Card title="已连接的主页" description="每个主页对应一个终端，可在终端中心绑定项目与身份。">
        {notConfigured ? (
          <div style={{ padding: 16, background: '#fef7e0', borderRadius: 8 }}>
            <p style={{ margin: '0 0 12px', color: '#744a00' }}>{NOT_CONFIGURED_MESSAGE}</p>
            <button type="button" className={listPageStyles.linkBtn} onClick={() => getFacebookConfigForSDK().then((c) => setConfig(c ?? null))}>
              重试
            </button>
          </div>
        ) : configLoading ? (
          <p style={{ color: '#5f6368', margin: 0 }}>加载中…</p>
        ) : (
          <>
            {showAuthButton && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <button
                  type="button"
                  className={listPageStyles.primaryBtn}
                  onClick={handleAuth}
                  disabled={authLoading}
                >
                  {authLoading ? '请稍候…' : '连接新主页'}
                </button>
                <button
                  type="button"
                  className={listPageStyles.linkBtn}
                  onClick={() => navigate(ROUTES.TENANT.TERMINALS)}
                >
                  前往终端中心
                </button>
              </div>
            )}
            {loadError ? (
              <div style={{ padding: 16, background: '#fff8f8', borderRadius: 8, marginBottom: 16 }}>
                <p style={{ margin: '0 0 12px', color: '#c00' }}>{loadError}</p>
                <button type="button" className={listPageStyles.primaryBtn} onClick={() => load()}>
                  重试
                </button>
              </div>
            ) : null}
            {config !== undefined && !loadError && (
              !loading && list.length === 0 ? (
                <EmptyState
                  title="还没有连接任何主页"
                  description="点击「连接新主页」，在本机登录 Facebook 并勾选要管理的主页即可。"
                />
              ) : (
                <Table
                  columns={columns}
                  dataSource={list}
                  rowKey="id"
                  loading={loading}
                  emptyText="暂无已连接的主页"
                />
              )
            )}
          </>
        )}
      </Card>
    </PageContainer>
  )
}
