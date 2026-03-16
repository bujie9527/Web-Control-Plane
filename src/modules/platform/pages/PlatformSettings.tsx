import { useCallback, useEffect, useState } from 'react'
import { PageContainer } from '@/components/PageContainer/PageContainer'
import { Card } from '@/components/Card/Card'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { StatusTag } from '@/components/StatusTag/StatusTag'
import {
  getFacebookIntegrationConfig,
  updateFacebookIntegrationConfig,
  type FacebookIntegrationClientConfig,
} from '@/modules/platform/services/platformIntegrationService'
import styles from './PlatformSettings.module.css'

const FACEBOOK_CALLBACK_PATH = '/api/facebook/auth/callback'
function isLocalhostRedirect(uri: string): boolean {
  const u = (uri || '').trim().toLowerCase()
  return u.includes('localhost') || u.includes('127.0.0.1')
}
function getDisplayRedirectUri(apiValue: string): { uri: string; isAuto: boolean } {
  if (apiValue && !isLocalhostRedirect(apiValue)) return { uri: apiValue, isAuto: false }
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return { uri: origin ? `${origin}${FACEBOOK_CALLBACK_PATH}` : '', isAuto: true }
}

export function PlatformSettings() {
  const [fbConfig, setFbConfig] = useState<FacebookIntegrationClientConfig | null | undefined>(undefined)
  const [fbLoading, setFbLoading] = useState(false)
  const [fbForm, setFbForm] = useState({
    appId: '',
    appSecret: '',
    redirectUri: '',
    scopes: '',
    isEnabled: true,
  })
  const [fbSaving, setFbSaving] = useState(false)
  const [fbError, setFbError] = useState('')
  const [fbSuccess, setFbSuccess] = useState('')
  const [testResult, setTestResult] = useState<'idle' | 'ok' | 'fail'>('idle')
  const [configValidBadge, setConfigValidBadge] = useState<'idle' | 'valid' | 'invalid' | 'unconfigured'>('idle')
  const [fbStats, setFbStats] = useState<{ totalAuthorizedPages: number; totalFacebookTerminals: number } | null>(null)
  const [fbStatsLoading, setFbStatsLoading] = useState(false)

  const loadFb = useCallback(async () => {
    setFbLoading(true)
    setFbError('')
    try {
      const config = await getFacebookIntegrationConfig()
      setFbConfig(config ?? null)
      if (config) {
        setFbForm({
          appId: config.appId,
          appSecret: '',
          redirectUri: config.redirectUri,
          scopes: config.scopes ?? '',
          isEnabled: config.isEnabled,
        })
      } else {
        setFbForm({
          appId: '',
          appSecret: '',
          redirectUri: '',
          scopes: '',
          isEnabled: true,
        })
      }
    } catch (e) {
      setFbError(e instanceof Error ? e.message : '加载配置失败')
      setFbConfig(null)
    } finally {
      setFbLoading(false)
    }
  }, [])

  useEffect(() => {
    loadFb()
  }, [loadFb])

  const fbConfigIsNull = fbConfig === null
  const fbConfigAppId = fbConfig?.appId
  useEffect(() => {
    if (fbConfigIsNull) setConfigValidBadge('unconfigured')
    else if (fbConfigAppId) setConfigValidBadge('valid')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fbConfigIsNull, fbConfigAppId])

  const handleSaveFb = async () => {
    setFbError('')
    setFbSuccess('')
    if (!fbForm.appId.trim()) {
      setFbError('请输入 Facebook App ID')
      return
    }
    setFbSaving(true)
    try {
      await updateFacebookIntegrationConfig({
        appId: fbForm.appId.trim(),
        appSecret: fbForm.appSecret.trim() || undefined,
        redirectUri: fbForm.redirectUri.trim() || undefined,
        scopes: fbForm.scopes.trim() || undefined,
        isEnabled: fbForm.isEnabled,
      })
      setFbSuccess('已保存')
      setTestResult('idle')
      setConfigValidBadge('idle')
      await loadFb()
      await handleTestFb()
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      loadFbStats().catch(() => {})
      setTimeout(() => setFbSuccess(''), 2000)
    } catch (e) {
      setFbError(e instanceof Error ? e.message : '保存失败')
    } finally {
      setFbSaving(false)
    }
  }

  const handleTestFb = async () => {
    setTestResult('idle')
    setConfigValidBadge('idle')
    try {
      const res = await fetch('/api/facebook/config')
      const json = await res.json()
      const appId = json?.data?.appId
      setTestResult(appId ? 'ok' : 'fail')
      setConfigValidBadge(appId ? 'valid' : (json?.data === null ? 'unconfigured' : 'invalid'))
    } catch {
      setTestResult('fail')
      setConfigValidBadge('invalid')
    }
  }

  const loadFbStats = useCallback(async () => {
    setFbStatsLoading(true)
    try {
      const res = await fetch('/api/platform-integrations/facebook/stats')
      const json = await res.json()
      if (json?.code === 0 && json?.data) {
        setFbStats(json.data)
      } else {
        setFbStats(null)
      }
    } catch {
      setFbStats(null)
    } finally {
      setFbStatsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (fbConfig?.appId) loadFbStats()
  }, [fbConfig?.appId, loadFbStats])

  return (
    <PageContainer
      title="平台设置"
      description="平台级基础与认证、通知等配置"
    >
      <Card title="认证配置" description="第三方登录与集成（如 Facebook 公共主页授权）">
        <div style={{ marginBottom: 16 }}>
          <strong>Facebook 公共主页集成</strong>
          <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#5f6368' }}>
            配置后，租户可在终端中心使用「用 Facebook 账号登录并授权」连接公共主页，无需编辑服务器配置文件。
          </p>
        </div>
        {fbLoading ? (
          <p style={{ color: '#5f6368' }}>加载中…</p>
        ) : (
          <>
            <div className={styles.statusRow}>
              <span className={styles.label}>状态：</span>
              {fbConfig ? (
                <StatusTag type={fbConfig.isEnabled ? 'success' : 'warning'}>{fbConfig.isEnabled ? '已配置' : '已停用'}</StatusTag>
              ) : (
                <StatusTag type="neutral">未配置</StatusTag>
              )}
              {configValidBadge !== 'idle' && (
                <>
                  <span className={styles.label} style={{ marginLeft: 16 }}>验证：</span>
                  {configValidBadge === 'valid' && <StatusTag type="success">配置有效</StatusTag>}
                  {configValidBadge === 'invalid' && <StatusTag type="error">配置无效</StatusTag>}
                  {configValidBadge === 'unconfigured' && <StatusTag type="neutral">未配置</StatusTag>}
                </>
              )}
              <span style={{ fontSize: 13, color: '#5f6368', marginLeft: 8 }}>
                {fbConfig ? (fbConfig.isEnabled ? '已启用' : '已停用') : '请在下方填写 App ID 与 App Secret 后保存'}
              </span>
            </div>
            <div className={styles.formGrid}>
              <label className={styles.label}>App ID</label>
              <input
                className={styles.input}
                value={fbForm.appId}
                onChange={(e) => setFbForm((p) => ({ ...p, appId: e.target.value }))}
                placeholder="在 Meta 开发者后台创建应用后获得"
              />
              <label className={styles.label}>App Secret</label>
              <div>
                <input
                  type="password"
                  className={styles.input}
                  value={fbForm.appSecret}
                  onChange={(e) => setFbForm((p) => ({ ...p, appSecret: e.target.value }))}
                  placeholder={fbConfig?.appSecretMasked ? '留空表示不修改' : '应用密钥'}
                />
                {fbConfig?.appSecretMasked && (
                  <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#5f6368' }}>
                    当前已保存：{fbConfig.appSecretMasked}
                  </p>
                )}
              </div>
              <label className={styles.label}>回调地址</label>
              {(() => {
                const { uri, isAuto } = getDisplayRedirectUri(fbForm.redirectUri)
                return (
                  <>
                    <input
                      className={`${styles.input} ${styles.readOnly}`}
                      value={uri}
                      readOnly
                      placeholder="根据当前访问域名自动生成"
                      title="OAuth 回调地址，随当前域名自动生成，无需修改"
                    />
                    {isAuto && uri && (
                      <p className={styles.hint} style={{ marginTop: 4 }}>
                        根据当前访问域名自动生成，请将此地址配置到 Meta 应用「有效 OAuth 重定向 URI」
                      </p>
                    )}
                  </>
                )
              })()}
              <label className={styles.label}>权限范围（scopes）</label>
              <input
                className={styles.input}
                value={fbForm.scopes}
                onChange={(e) => setFbForm((p) => ({ ...p, scopes: e.target.value }))}
                placeholder="留空使用默认 pages_show_list；完整权限需在 Meta 应用添加 Pages API 用例后再填"
              />
              <p className={styles.hint}>
                若出现 Invalid Scopes，请在 Meta 应用后台添加「Pages API」或「管理主页」用例并勾选所需权限，再在此填写完整 scope（如 pages_show_list,pages_read_engagement,pages_manage_posts,pages_manage_engagement）。
              </p>
              <label className={styles.label}>启用</label>
              <select
                className={styles.input}
                style={{ maxWidth: 120 }}
                value={fbForm.isEnabled ? 'yes' : 'no'}
                onChange={(e) => setFbForm((p) => ({ ...p, isEnabled: e.target.value === 'yes' }))}
              >
                <option value="yes">启用</option>
                <option value="no">停用</option>
              </select>
            </div>
            {fbError && <p className={styles.error}>{fbError}</p>}
            {fbSuccess && <p className={styles.success}>{fbSuccess}</p>}
            {testResult === 'ok' && <p className={styles.success}>当前配置可被授权接口读取</p>}
            {testResult === 'fail' && <p className={styles.error}>无法读取配置，请先保存</p>}
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={handleSaveFb}
                disabled={fbSaving}
              >
                {fbSaving ? '保存中…' : '保存'}
              </button>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={handleTestFb}
              >
                测试连接
              </button>
            </div>
          </>
        )}
      </Card>
      {fbConfig?.appId && (
        <Card title="Facebook 使用统计" description="平台内已授权主页与终端数量">
          {fbStatsLoading ? (
            <p style={{ color: '#5f6368' }}>加载中…</p>
          ) : fbStats ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 24px', margin: 0 }}>
              <span style={{ color: '#5f6368', fontWeight: 500 }}>已授权主页数</span>
              <span>{fbStats.totalAuthorizedPages}</span>
              <span style={{ color: '#5f6368', fontWeight: 500 }}>Facebook 终端实例数</span>
              <span>{fbStats.totalFacebookTerminals}</span>
            </div>
          ) : (
            <p style={{ color: '#5f6368' }}>暂无统计或加载失败</p>
          )}
        </Card>
      )}
      <Card title="基础设置" description="系统名称、Logo 等">
        <EmptyState title="骨架占位" description="基础设置将在后续完善" />
      </Card>
      <Card title="通知配置" description="站内信与邮件通知">
        <EmptyState title="骨架占位" description="通知配置将在后续完善" />
      </Card>
      <Card title="系统参数" description="平台运行参数">
        <EmptyState title="骨架占位" description="系统参数将在后续完善" />
      </Card>
    </PageContainer>
  )
}
