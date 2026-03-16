import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

/** 根级错误边界：捕获渲染错误，避免白屏且无提示 */
export class RootErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[RootErrorBoundary]', error, errorInfo)
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div
          style={{
            padding: 24,
            fontFamily: 'system-ui, sans-serif',
            maxWidth: 640,
            margin: '40px auto',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 8,
          }}
        >
          <h2 style={{ margin: '0 0 12px', color: '#b91c1c' }}>页面加载出错</h2>
          <pre
            style={{
              margin: 0,
              fontSize: 12,
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {this.state.error.message}
          </pre>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{ marginTop: 16, padding: '8px 16px', cursor: 'pointer' }}
          >
            重试
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
