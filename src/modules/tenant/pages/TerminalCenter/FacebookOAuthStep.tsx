/**
 * 新建终端向导 - Facebook 公共主页 OAuth 授权步骤
 * 当终端类型 authType 为 oauth_facebook 时渲染，替代手填凭证表单
 */
import { useEffect, useRef, useState } from 'react'
import { Card } from '@/components/Card/Card'
import { listPageStyles } from '@/components/ListPageToolbar/ListPageToolbar'
import {
  getFacebookConfigForSDK,
  authorizeWithFBSDK,
  initOAuthRedirect,
} from '@/modules/tenant/services/facebookTerminalService'
import type { AuthorizeResult } from '@/modules/tenant/services/facebookTerminalService'

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

export interface FacebookOAuthStepProps {
  tenantId: string
  onSuccess: (result: AuthorizeResult) => void
  onBack: () => void
}

export function FacebookOAuthStep({ tenantId, onSuccess, onBack }: FacebookOAuthStepProps) {
  const [config, setConfig] = useState<{ appId: string; scopes: string } | null | undefined>(undefined)
  const [authLoading, setAuthLoading] = useState(false)
  const [notice, setNotice] = useState('')
  const [result, setResult] = useState<AuthorizeResult | null>(null)
  const sdkReady = useRef(false)

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
    return () => {
      cancelled = true
    }
  }, [])

  const handleAuth = async () => {
    if (!config?.appId) {
      setNotice(NOT_CONFIGURED_MESSAGE)
      return
    }
    if (!tenantId) {
      setNotice('无法获取当前租户，请重新进入页面')
      return
    }
    setAuthLoading(true)
    setNotice('')
    setResult(null)
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
            .then((res) => {
              setResult(res)
              setNotice(res.pageCount > 0 ? `已连接 ${res.pageCount} 个主页，每个主页已作为终端添加。` : '未找到可管理的主页，请确认你在 Facebook 有公共主页。')
            })
            .catch((e) => setNotice(e instanceof Error ? e.message : '授权保存失败'))
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

  const isSuccessNotice = notice.startsWith('已连接') || notice.includes('成功')
  const notConfigured = config === null
  const configLoading = config === undefined

  return (
    <Card
      title="授权 Facebook 公共主页"
      description="无需填写凭证，点击下方按钮登录 Facebook 并选择要管理的主页，系统将自动为每个主页创建一个终端。"
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
      {notConfigured ? (
        <div style={{ padding: 16, background: '#fef7e0', borderRadius: 8 }}>
          <p style={{ margin: '0 0 12px', color: '#744a00' }}>{NOT_CONFIGURED_MESSAGE}</p>
        </div>
      ) : configLoading ? (
        <p style={{ color: '#5f6368', margin: 0 }}>加载配置中…</p>
      ) : (
        <>
          {config?.appId && (
            <p style={{ margin: '0 0 12px', fontSize: 13, color: '#5f6368' }}>
              应用 ID：{config.appId.slice(0, 8)}****（由平台统一配置）
            </p>
          )}
          {!result ? (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
              <button
                type="button"
                className={listPageStyles.primaryBtn}
                onClick={handleAuth}
                disabled={authLoading}
              >
                {authLoading ? '请稍候…' : '开始授权'}
              </button>
              <button
                type="button"
                className={listPageStyles.linkBtn}
                onClick={onBack}
              >
                上一步
              </button>
            </div>
          ) : (
            <div className="footer" style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button type="button" className={listPageStyles.linkBtn} onClick={onBack}>
                上一步
              </button>
              <button
                type="button"
                className={listPageStyles.primaryBtn}
                onClick={() => onSuccess(result)}
              >
                完成，查看终端列表
              </button>
            </div>
          )}
        </>
      )}
    </Card>
  )
}
