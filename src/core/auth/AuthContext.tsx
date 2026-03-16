import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { AuthState, ConsoleType, User } from '@/core/types/auth'
import { MOCK_USERS } from './mockUsers'

const STORAGE_KEY = 'awcc_auth'
const TOKEN_KEY = 'awcc_token'

function loadStored(): AuthState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AuthState
  } catch {
    return null
  }
}

function saveStored(state: AuthState | null) {
  if (state?.user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } else {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(TOKEN_KEY)
  }
}

interface AuthContextValue extends AuthState {
  login: (user: User) => void
  logout: () => void
  /** 账号密码登录（调用 POST /api/auth/login），成功写入 state 与 localStorage，返回 consoleType 用于跳转 */
  loginWithCredentials: (account: string, password: string) => Promise<ConsoleType>
  /** 用 account 模拟登录（开发兜底），返回应跳转的 consoleType */
  loginWithAccount: (account: string) => { user: User; consoleType: ConsoleType } | null
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(() => loadStored() ?? { user: null, consoleType: 'platform' })

  const login = useCallback((user: User) => {
    const consoleType: ConsoleType = user.tenant ? 'tenant' : 'platform'
    const next: AuthState = { user, consoleType }
    setState(next)
    saveStored(next)
  }, [])

  const logout = useCallback(() => {
    setState({ user: null, consoleType: 'platform' })
    saveStored(null)
  }, [])

  const loginWithCredentials = useCallback(async (account: string, password: string): Promise<ConsoleType> => {
    const base = typeof window !== 'undefined' ? '' : 'http://localhost:3001'
    const res = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account: account.trim(), password }),
    })
    let json: { code: number; message?: string; data?: { token: string; user: { id: string; account: string; name: string; role: string; tenantId?: string | null } } }
    try {
      json = (await res.json()) as typeof json
    } catch {
      throw new Error(`服务器响应异常（HTTP ${res.status}），请检查后端是否正常运行`)
    }
    if (!res.ok || json.code !== 0 || !json.data) {
      throw new Error(json.message ?? '登录失败')
    }
    const { token, user: u } = json.data
    localStorage.setItem(TOKEN_KEY, token)
    const user: User = {
      id: u.id,
      name: u.name,
      account: u.account,
      role: u.role as User['role'],
      tenant: u.tenantId ? { tenantId: u.tenantId, tenantName: '' } : undefined,
    }
    const consoleType: ConsoleType = user.tenant ? 'tenant' : 'platform'
    setState({ user, consoleType })
    saveStored({ user, consoleType })
    return consoleType
  }, [])

  const loginWithAccount = useCallback((account: string) => {
    const user = MOCK_USERS.find((u) => u.account === account)
    if (!user) return null
    const consoleType: ConsoleType = user.tenant ? 'tenant' : 'platform'
    return { user, consoleType }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      login,
      logout,
      loginWithCredentials,
      loginWithAccount,
    }),
    [state, login, logout, loginWithCredentials, loginWithAccount]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
