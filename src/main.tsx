import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/core/auth/AuthContext'
import { AppRoutes } from '@/app/routes'
import { RootErrorBoundary } from '@/app/RootErrorBoundary'
import './index.css'

const rootEl = document.getElementById('root')
if (!rootEl) {
  document.body.innerHTML = '<p style="padding:24px;font-family:system-ui">未找到 #root 节点</p>'
} else {
  try {
    ReactDOM.createRoot(rootEl).render(
      <React.StrictMode>
        <RootErrorBoundary>
          <BrowserRouter>
            <AuthProvider>
              <AppRoutes />
              <Toaster richColors closeButton position="bottom-right" />
            </AuthProvider>
          </BrowserRouter>
        </RootErrorBoundary>
      </React.StrictMode>
    )
  } catch (e) {
    rootEl.innerHTML = `<pre style="padding:24px;font-size:12px;color:#b91c1c">初始化失败：${e instanceof Error ? e.message : String(e)}</pre>`
  }
}
