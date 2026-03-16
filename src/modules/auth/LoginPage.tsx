import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/core/auth/AuthContext'
import { MOCK_USERS } from '@/core/auth/mockUsers'
import { ROUTES } from '@/core/constants/routes'
import styles from './LoginPage.module.css'

export function LoginPage() {
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { loginWithCredentials, loginWithAccount, login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!account.trim()) {
      setError('请选择或输入账号')
      return
    }
    if (password) {
      // 账号 + 密码：调用真实 API 登录
      setLoading(true)
      try {
        const consoleType = await loginWithCredentials(account.trim(), password)
        const to = consoleType === 'tenant' ? ROUTES.TENANT.HOME : ROUTES.PLATFORM.HOME
        navigate(to, { replace: true })
      } catch (err) {
        setError(err instanceof Error ? err.message : '登录失败')
      } finally {
        setLoading(false)
      }
    } else {
      // 仅账号：使用预设 mock 账号快速登录（开发/演示用）
      const result = loginWithAccount(account.trim())
      if (result) {
        login(result.user)
        const to = result.consoleType === 'platform' ? ROUTES.PLATFORM.HOME : ROUTES.TENANT.HOME
        navigate(to, { replace: true })
      } else {
        setError('预设账号不存在，请检查账号或输入密码进行真实登录')
      }
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>AI Work Control Center</h1>
        <p className={styles.subtitle}>企业级 AI 工作中控后台</p>

        {/* 快速登录：本地与云端均保留，便于演示与运维 */}
        <div className={styles.quickSelect}>
          <p className={styles.quickLabel}>快速登录（演示账号，点击后点「进入后台」）：</p>
          <div className={styles.quickBtns}>
            {MOCK_USERS.map((u) => (
              <button
                key={u.account}
                type="button"
                className={styles.quickBtn}
                onClick={() => {
                  setAccount(u.account)
                  setPassword('')
                  setError('')
                }}
              >
                {u.name}
                <span className={styles.quickBtnRole}>
                  {u.tenant ? `（${u.tenant.tenantName}）` : '（平台后台）'}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className={styles.divider}>或使用账号密码登录</div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.label}>账号</label>
          <input
            className={styles.input}
            type="text"
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            placeholder="admin"
            required
            autoComplete="username"
          />
          <label className={styles.label}>
            密码
            <span className={styles.labelHint}>（留空则使用预设账号直接登录）</span>
          </label>
          <input
            className={styles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="请输入密码"
            autoComplete="current-password"
          />
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? '登录中…' : '进入后台'}
          </button>
        </form>
      </div>
    </div>
  )
}
