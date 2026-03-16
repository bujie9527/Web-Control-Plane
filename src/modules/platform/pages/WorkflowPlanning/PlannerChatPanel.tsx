/**
 * PlannerChatPanel
 * 流程规划工作台左侧的对话面板
 *
 * 功能：
 * - 展示消息气泡列表（user / assistant / system / error 四种样式）
 * - 提供 textarea 输入框（Enter 发送，Shift+Enter 换行）
 * - 发送时乐观更新：立即追加用户消息气泡，不等待后端返回
 * - 展示"助手正在思考..."loading 气泡（发送后 / 生成初稿时）
 * - 无草案时按钮文案为"生成初稿"，有草案时为"发送"
 * - 消息列表自动滚动到最新消息（useRef + scrollIntoView）
 * - 发送失败时在消息列表末尾追加错误气泡（可重试）
 *
 * 设计决策：
 * - 此组件仅负责 UI 展示与用户输入，业务逻辑（LLM 调用等）由父组件
 *   WorkflowPlanningWorkbench 通过 onSend 回调处理
 * - 不在此组件内调用任何 service
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  WorkflowPlanningMessage,
  PlanningMessageRole,
} from '@/modules/tenant/schemas/workflowPlanningSession'
import type { ValidationResult } from '@/modules/tenant/services/workflowPlanningValidator'

// ─── 消息类型扩展 ─────────────────────────────────────────────────────────────

/**
 * ChatMessage
 * 前端本地消息对象（扩展 WorkflowPlanningMessage，增加本地临时态）
 * - 从后端加载的历史消息直接使用 WorkflowPlanningMessage
 * - 乐观更新时先创建 isOptimistic=true 的本地消息，后端确认后替换
 */
export interface ChatMessage extends WorkflowPlanningMessage {
  /** 是否为本地乐观追加（未经后端确认） */
  isOptimistic?: boolean
  /** 是否为 loading 占位气泡（助手正在思考） */
  isLoading?: boolean
  /** 是否为错误气泡（本地态，发送失败时追加） */
  isError?: boolean
  /** 错误时的重试回调 */
  onRetry?: () => void
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface PlannerChatPanelProps {
  /** 消息列表（来自父组件 state，已包含乐观追加的消息） */
  messages: ChatMessage[]
  /** 是否有当前草案（决定发送按钮文案和默认提示） */
  hasDraft: boolean
  /** 是否正在等待助手回复（控制输入框 disabled 和 loading 气泡） */
  sending: boolean
  /**
   * 用户发送消息时的回调
   * 父组件负责：
   * 1. 追加乐观用户消息到 messages
   * 2. 调用 LLM（generate 或 revise）
   * 3. 追加助手回复 / 错误消息
   * 4. 局部更新 currentDraft（不调全量 load）
   */
  onSend: (text: string) => Promise<void>
  /** 规划上下文折叠卡片内容（可选，已废弃，由工作台顶部可折叠条承载） */
  contextSummary?: React.ReactNode
  /** 当前草案校验结果，在消息区底部以系统态展示 */
  validationResult?: ValidationResult | null
  /** 当前草案修改摘要 */
  changeSummary?: string | null
  /** 当前草案风险提示 */
  riskNotes?: string | null
}

// ─── 消息气泡角色样式映射 ─────────────────────────────────────────────────────

/**
 * getRoleBubbleStyle
 * 返回不同角色消息的气泡样式对象
 * - user：右对齐，蓝色背景
 * - assistant：左对齐，浅灰背景
 * - system：居中，绿色小字
 * - error（isError=true）：居中，红色小字
 */
function getRoleBubbleStyle(role: PlanningMessageRole, isError?: boolean): React.CSSProperties {
  if (isError) {
    return { textAlign: 'center', color: '#cf1322', fontSize: 12, margin: '8px 0' }
  }
  if (role === 'user') {
    return { marginLeft: 'auto', maxWidth: '85%', padding: '8px 12px', background: '#1677ff', color: '#fff', borderRadius: 8 }
  }
  if (role === 'assistant') {
    return { maxWidth: '85%', padding: '8px 12px', background: '#f0f0f0', color: '#333', borderRadius: 8 }
  }
  return { textAlign: 'center', color: '#52c41a', fontSize: 12, margin: '8px 0' }
}

function getRoleLabel(role: PlanningMessageRole): string {
  if (role === 'user') return '你'
  if (role === 'assistant') return '流程规划助手'
  return '系统'
}

// ─── 子组件 ───────────────────────────────────────────────────────────────────

/**
 * MessageBubble
 * 单条消息气泡
 * - user：右对齐蓝色气泡
 * - assistant：左对齐灰色气泡 + 底部展示草案版本和耗时（relatedDraftVersion / latencyMs）
 * - system：居中绿色小字（无气泡背景）
 * - isLoading：左对齐灰色气泡 + "助手正在思考..." 动画
 * - isError：居中红色小字 + [重试] 按钮
 */
function MessageBubble({ msg }: { msg: ChatMessage }) {
  if (msg.isError) {
    return (
      <div style={getRoleBubbleStyle('system', true)}>
        {msg.content}
        {msg.onRetry && (
          <button type="button" onClick={msg.onRetry} style={{ marginLeft: 8 }}>
            重试
          </button>
        )}
      </div>
    )
  }
  const style = getRoleBubbleStyle(msg.role)
  return (
    <div style={{ marginBottom: 12, display: 'flex', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
      <div style={style}>
        <span style={{ fontSize: 11, opacity: 0.9 }}>{getRoleLabel(msg.role)}</span>
        <p style={{ margin: '4px 0 0', whiteSpace: 'pre-wrap' }}>{msg.content}</p>
        {msg.role === 'assistant' && (msg as ChatMessage & { relatedDraftVersion?: number }).relatedDraftVersion != null && (
          <span style={{ fontSize: 11, color: '#666', display: 'block', marginTop: 4 }}>
            草案 v{(msg as ChatMessage & { relatedDraftVersion?: number }).relatedDraftVersion}
          </span>
        )}
      </div>
    </div>
  )
}

function LoadingBubble() {
  return (
    <div style={{ marginBottom: 12, display: 'flex' }}>
      <div style={getRoleBubbleStyle('assistant')}>
        <span style={{ fontSize: 11, opacity: 0.9 }}>流程规划助手</span>
        <p style={{ margin: '4px 0 0', color: '#999' }}>助手正在思考...</p>
      </div>
    </div>
  )
}

// ─── 主组件 ───────────────────────────────────────────────────────────────────

export function PlannerChatPanel({
  messages,
  hasDraft,
  sending,
  onSend,
  contextSummary: _contextSummary,
  validationResult,
  changeSummary,
  riskNotes,
}: PlannerChatPanelProps) {
  /** 输入框内容 */
  const [inputText, setInputText] = useState('')
  /** 消息列表底部的 ref，用于自动滚动 */
  const bottomRef = useRef<HTMLDivElement>(null)

  /**
   * 每当 messages 更新时，自动滚动到最新消息
   */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  /**
   * handleSend
   * 发送消息
   * 1. 校验 inputText 非空
   * 2. 清空输入框（先清，避免用户重复发送）
   * 3. 调用 onSend(inputText)
   * 4. 若 onSend 抛出错误，不需在此处理（父组件追加错误气泡）
   */
  const handleSend = useCallback(async () => {
    const text = inputText.trim()
    if (!text || sending) return
    setInputText('')
    await onSend(text)
  }, [inputText, sending, onSend])

  /**
   * handleKeyDown
   * 键盘事件处理
   * Enter（无 Shift）：触发 handleSend
   * Shift+Enter：默认行为（换行），不拦截
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend],
  )

  const hasDraftStatus = validationResult || changeSummary || riskNotes

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* 消息气泡列表（可滚动） */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
        {messages.length === 0 && !sending && (
          <p style={{ textAlign: 'center', color: '#999', fontSize: 13 }}>
            {hasDraft
              ? '输入修改建议发送给流程规划助手'
              : '发送任意消息，流程规划助手将为你生成流程初稿'}
          </p>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}
        {/* sending 时展示 loading 气泡 */}
        {sending && <LoadingBubble />}
        {/* 草案状态：校验结果 / 修改摘要 / 风险提示（系统态展示） */}
        {hasDraftStatus && (
          <div style={{ marginTop: 12, padding: 10, background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 8, fontSize: 12 }}>
            {validationResult && (
              <div style={{ color: validationResult.isValid ? '#52c41a' : '#cf1322', marginBottom: changeSummary || riskNotes ? 6 : 0 }}>
                {validationResult.normalizedSummary}
              </div>
            )}
            {changeSummary && (
              <div style={{ color: '#333', marginBottom: riskNotes ? 6 : 0 }}>
                <strong>修改摘要：</strong> {changeSummary}
              </div>
            )}
            {riskNotes && (
              <div style={{ color: '#b36b00' }}>
                <strong>风险提示：</strong> {riskNotes}
              </div>
            )}
          </div>
        )}
        {/* 自动滚动锚点 */}
        <div ref={bottomRef} />
      </div>

      {/* 输入区 */}
      <div style={{ borderTop: '1px solid #eee', padding: '12px 0 0' }}>
        <textarea
          rows={2}
          placeholder={
            hasDraft
              ? '输入修改建议，如：增加一个数据校验节点...'
              : '描述你的工作流程或粘贴 SOP，助手将生成流程初稿...'
          }
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={sending}
          style={{ width: '100%', resize: 'none', boxSizing: 'border-box' }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || !inputText.trim()}
          >
            {sending ? '处理中…' : hasDraft ? '发送' : '生成初稿'}
          </button>
        </div>
      </div>
    </div>
  )
}
