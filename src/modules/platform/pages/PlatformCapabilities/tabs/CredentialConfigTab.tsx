/**
 * Facebook 能力凭证配置（App ID / App Secret）
 * 复用平台设置同源接口，仅当能力 code 为 facebook_page_api 时展示
 * 回调地址：空或 localhost 时按当前访问域名自动生成，不写死
 */
import { useCallback, useEffect, useState } from 'react'

const FACEBOOK_CALLBACK_PATH = '/api/facebook/auth/callback'
function isLocalhostRedirect(uri: string): boolean {
  const u = (uri || '').trim().toLowerCase()
  return u.includes('localhost') || u.includes('127.0.0.1')
}
function getDisplayRedirectUri(apiValue: string): { uri: string; isAuto: boolean } {
  if (apiValue && !isLocalhostRedirect(apiValue))
    return { uri: apiValue, isAuto: false }
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return { uri: origin ? `${origin}${FACEBOOK_CALLBACK_PATH}` : '', isAuto: true }
}
import { StatusTag } from '@/components/StatusTag/StatusTag'
import {
  getFacebookIntegrationConfig,
  updateFacebookIntegrationConfig,
  type FacebookIntegrationClientConfig,
} from '@/modules/platform/services/platformIntegrationService'
import styles from '../PlatformCapabilities.module.css'

export function CredentialConfigTab() {
  const [config, setConfig] = useState<FacebookIntegrationClientConfig | null | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    appId: '',
    appSecret: '',
    redirectUri: '',
    scopes: '',
    isEnabled: true,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getFacebookIntegrationConfig()
      setConfig(data ?? null)
      if (data) {
        setForm({
          appId: data.appId,
          appSecret: '',
          redirectUri: data.redirectUri,
          scopes: data.scopes ?? '',
          isEnabled: data.isEnabled,
        })
      } else {
        setForm({
          appId: '',
          appSecret: '',
          redirectUri: '',
          scopes: '',
          isEnabled: true,
        })
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载配置失败')
      setConfig(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleSave = async () => {
    setError('')
    setSuccess('')
    if (!form.appId.trim()) {
      setError('请输入 App ID')
      return
    }
    setSaving(true)
    try {
      await updateFacebookIntegrationConfig({
        appId: form.appId.trim(),
        appSecret: form.appSecret.trim() || undefined,
        redirectUri: form.redirectUri.trim() || undefined,
        scopes: form.scopes.trim() || undefined,
        isEnabled: form.isEnabled,
      })
      setSuccess('已保存')
      setTimeout(() => setSuccess(''), 2500)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className={styles.loading}>加载中…</div>
  }

  return (
    <div className={styles.infoTab}>
      <p style={{ margin: '0 0 16px', fontSize: 13, color: '#6b7280' }}>
        配置 Meta 应用的 App ID 与 App Secret 后，租户可在终端中心通过「用 Facebook 账号登录」授权公共主页，无需修改服务端配置。
      </p>
      <div className={styles.credentialForm}>
        <div className={styles.formRow}>
          <label className={styles.label}>App ID</label>
          <input
            className={styles.input}
            type="text"
            value={form.appId}
            onChange={(e) => setForm((p) => ({ ...p, appId: e.target.value }))}
            placeholder="在 Meta 开发者后台创建应用后获得"
          />
        </div>
        <div className={styles.formRow}>
          <label className={styles.label}>App Secret</label>
          <input
            className={styles.input}
            type="password"
            value={form.appSecret}
            onChange={(e) => setForm((p) => ({ ...p, appSecret: e.target.value }))}
            placeholder={config?.appSecretMasked ? '留空表示不修改' : '应用密钥'}
          />
          {config?.appSecretMasked && (
            <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#6b7280' }}>
              当前已保存：{config.appSecretMasked}
            </p>
          )}
        </div>
        <div className={styles.formRow}>
          <label className={styles.label}>回调地址</label>
          {(() => {
            const { uri, isAuto } = getDisplayRedirectUri(form.redirectUri)
            return (
              <>
                <input
                  className={styles.input}
                  type="text"
                  value={uri}
                  readOnly
                  placeholder="根据当前访问域名自动生成"
                  title="OAuth 回调地址，随当前域名自动生成，无需修改"
                />
                {isAuto && uri && (
                  <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#6b7280' }}>
                    根据当前访问域名自动生成，请将此地址配置到 Meta 应用「有效 OAuth 重定向 URI」
                  </p>
                )}
              </>
            )
          })()}
        </div>
        <div className={styles.formRow}>
          <label className={styles.label}>权限范围（scopes）</label>
          <input
            className={styles.input}
            type="text"
            value={form.scopes}
            onChange={(e) => setForm((p) => ({ ...p, scopes: e.target.value }))}
            placeholder="留空使用默认 pages_show_list"
          />
          <p className={styles.hint}>
            完整权限需在 Meta 应用后台添加「Pages API」用例后填写，例如：pages_show_list,pages_read_engagement,pages_manage_posts
          </p>
        </div>
        <div className={styles.formRow}>
          <label className={styles.label}>状态</label>
          <select
            className={styles.input}
            style={{ maxWidth: 120 }}
            value={form.isEnabled ? 'yes' : 'no'}
            onChange={(e) => setForm((p) => ({ ...p, isEnabled: e.target.value === 'yes' }))}
          >
            <option value="yes">启用</option>
            <option value="no">停用</option>
          </select>
          {config && (
            <span style={{ marginLeft: 12 }}>
              <StatusTag type={config.isEnabled ? 'success' : 'warning'}>
                {config.isEnabled ? '已启用' : '已停用'}
              </StatusTag>
            </span>
          )}
        </div>
      </div>
      {error && <p className={styles.error} style={{ marginTop: 12 }}>{error}</p>}
      {success && <p style={{ marginTop: 12, color: '#059669', fontSize: 14 }}>{success}</p>}
      <div className={styles.formActions} style={{ marginTop: 16 }}>
        <button
          type="button"
          className={styles.primaryBtn}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? '保存中…' : '保存'}
        </button>
      </div>
    </div>
  )
}
