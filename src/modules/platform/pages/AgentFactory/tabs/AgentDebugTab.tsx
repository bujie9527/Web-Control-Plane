/**
 * Agent 调试模式 Tab：自然语言对话 + 配置文档编辑，不依赖实际流程即可验证效果
 */
import { useCallback, useState } from 'react'
import { Card } from '@/components/Card/Card'
import type { AgentTemplate } from '@/modules/platform/schemas/agentTemplate'
import type {
  AgentDebugConfigOverrides,
  AgentDebugMessage,
} from '@/modules/platform/schemas/agentDebug'
import {
  executeAgentDebug,
  saveDebugOverridesToTemplate,
} from '@/modules/platform/services/agentDebugService'
import styles from '../AgentFactoryList.module.css'
import { listPageStyles } from '@/components/ListPageToolbar/ListPageToolbar'

interface AgentDebugTabProps {
  detail: AgentTemplate
}

function nextId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function useAgentDebugConfig(_template: AgentTemplate) {
  const [overrides, setOverrides] = useState<AgentDebugConfigOverrides>({})

  const setField = useCallback(
    (key: keyof AgentDebugConfigOverrides, value: string | number) => {
      setOverrides((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  const resetToTemplate = useCallback(() => {
    setOverrides({})
  }, [])

  const isDirty = Object.keys(overrides).some(
    (k) => overrides[k as keyof AgentDebugConfigOverrides] !== undefined
  )

  return { overrides, setField, resetToTemplate, isDirty }
}

function useAgentDebugChat(
  agentTemplateId: string,
  getOverrides: () => AgentDebugConfigOverrides
) {
  const [messages, setMessages] = useState<AgentDebugMessage[]>([])
  const [sending, setSending] = useState(false)

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || sending) return
      const userMsg: AgentDebugMessage = {
        id: nextId(),
        role: 'user',
        content: text.trim(),
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, userMsg])
      setSending(true)
      try {
        const result = await executeAgentDebug(
          agentTemplateId,
          text.trim(),
          getOverrides()
        )
        const assistantMsg: AgentDebugMessage = {
          id: nextId(),
          role: 'assistant',
          content: result.ok
            ? (result.rawText ?? '（无文本输出）')
            : (result.errorMessageZh ?? '调用失败'),
          timestamp: new Date().toISOString(),
          latencyMs: result.latencyMs,
          modelKey: result.modelKey,
          errorMessageZh: result.ok ? undefined : result.errorMessageZh,
        }
        setMessages((prev) => [...prev, assistantMsg])
      } catch {
        const errMsg: AgentDebugMessage = {
          id: nextId(),
          role: 'assistant',
          content: '调用异常',
          timestamp: new Date().toISOString(),
          errorMessageZh: '调用异常',
        }
        setMessages((prev) => [...prev, errMsg])
      } finally {
        setSending(false)
      }
    },
    [agentTemplateId, getOverrides, sending]
  )

  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  return { messages, sending, sendMessage, clearMessages }
}

function DebugMessageItem({ message }: { message: AgentDebugMessage }) {
  const isUser = message.role === 'user'
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: 12,
      }}
    >
      <div
        style={{
          maxWidth: '80%',
          padding: '10px 14px',
          borderRadius: 8,
          background: isUser ? '#1a73e8' : '#f1f3f4',
          color: isUser ? '#fff' : '#202124',
          fontSize: 14,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        <div>{message.content}</div>
        {message.errorMessageZh && (
          <div style={{ marginTop: 6, fontSize: 12, color: '#d93025' }}>
            {message.errorMessageZh}
          </div>
        )}
        {(message.latencyMs != null || message.modelKey) && (
          <div
            style={{
              marginTop: 6,
              fontSize: 11,
              opacity: 0.85,
            }}
          >
            {message.latencyMs != null && `耗时 ${message.latencyMs}ms`}
            {message.latencyMs != null && message.modelKey && ' · '}
            {message.modelKey && message.modelKey}
          </div>
        )}
      </div>
    </div>
  )
}

function DebugConfigEditor({
  template,
  overrides,
  onSetField,
  onReset,
  isDirty,
  onSaveToTemplate,
  savingConfig,
}: {
  template: AgentTemplate
  overrides: AgentDebugConfigOverrides
  onSetField: (key: keyof AgentDebugConfigOverrides, value: string | number) => void
  onReset: () => void
  isDirty: boolean
  onSaveToTemplate: () => void
  savingConfig: boolean
}) {
  return (
    <Card
      title="配置覆盖（调试用）"
      description="编辑后仅对本次对话生效；可点击「恢复模板配置」或「保存到模板」"
    >
      {isDirty && (
        <p className={styles.formHint} style={{ marginBottom: 12 }}>
          当前已修改，与模板不同，未保存到模板。
        </p>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 12 }}>
        <button
          type="button"
          className={listPageStyles.linkBtn}
          onClick={onReset}
          disabled={!isDirty}
        >
          恢复模板配置
        </button>
        <button
          type="button"
          className={listPageStyles.primaryBtn}
          onClick={onSaveToTemplate}
          disabled={!isDirty || savingConfig}
        >
          {savingConfig ? '保存中...' : '保存到模板'}
        </button>
      </div>
      <div className={styles.formRow}>
        <label>系统 Prompt（systemPromptTemplate）</label>
        <textarea
          value={overrides.systemPromptTemplate ?? template.systemPromptTemplate ?? ''}
          onChange={(e) => onSetField('systemPromptTemplate', e.target.value)}
          placeholder={template.systemPromptTemplate || '留空则使用模板值'}
          rows={4}
          style={{ minHeight: 80 }}
        />
      </div>
      <div className={styles.formRow}>
        <label>指令模板（instructionTemplate）</label>
        <textarea
          value={overrides.instructionTemplate ?? template.instructionTemplate ?? ''}
          onChange={(e) => onSetField('instructionTemplate', e.target.value)}
          placeholder={template.instructionTemplate || '留空则使用模板值'}
          rows={3}
        />
      </div>
      <div className={styles.formRow}>
        <label>输出格式（outputFormat）</label>
        <textarea
          value={overrides.outputFormat ?? template.outputFormat ?? ''}
          onChange={(e) => onSetField('outputFormat', e.target.value)}
          placeholder={template.outputFormat || '留空则使用模板值'}
          rows={2}
        />
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div className={styles.formRow} style={{ width: 120 }}>
          <label>temperature</label>
          <input
            type="number"
            min={0}
            max={2}
            step={0.1}
            value={
              overrides.temperature ?? template.temperature ?? 0.7
            }
            onChange={(e) =>
              onSetField('temperature', Number.parseFloat(e.target.value) || 0.7)
            }
          />
        </div>
        <div className={styles.formRow} style={{ width: 120 }}>
          <label>maxTokens</label>
          <input
            type="number"
            min={1}
            max={8000}
            value={overrides.maxTokens ?? template.maxTokens ?? 1000}
            onChange={(e) =>
              onSetField('maxTokens', Number.parseInt(e.target.value, 10) || 1000)
            }
          />
        </div>
      </div>
    </Card>
  )
}

export function AgentDebugTab({ detail }: AgentDebugTabProps) {
  const config = useAgentDebugConfig(detail)
  const getOverrides = useCallback(() => config.overrides, [config.overrides])
  const chat = useAgentDebugChat(detail.id, getOverrides)
  const [savingConfig, setSavingConfig] = useState(false)
  const [inputValue, setInputValue] = useState('')

  const handleSaveToTemplate = useCallback(async () => {
    setSavingConfig(true)
    try {
      await saveDebugOverridesToTemplate(detail.id, config.overrides)
      config.resetToTemplate()
    } finally {
      setSavingConfig(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- 仅保存时取最新 config
  }, [detail.id, config.overrides, config.resetToTemplate])

  const handleSend = useCallback(() => {
    if (!inputValue.trim() || chat.sending) return
    chat.sendMessage(inputValue.trim())
    setInputValue('')
  // eslint-disable-next-line react-hooks/exhaustive-deps -- 仅发送时取最新 inputValue/chat
  }, [inputValue, chat.sending, chat.sendMessage])

  return (
    <>
      <DebugConfigEditor
        template={detail}
        overrides={config.overrides}
        onSetField={config.setField}
        onReset={config.resetToTemplate}
        isDirty={config.isDirty}
        onSaveToTemplate={handleSaveToTemplate}
        savingConfig={savingConfig}
      />

      <Card
        title="对话测试"
        description="输入自然语言与当前 Agent 配置互动，无需放入实际流程即可验证效果"
      >
        <div
          style={{
            minHeight: 200,
            maxHeight: 400,
            overflowY: 'auto',
            padding: 12,
            background: '#fafafa',
            borderRadius: 8,
            marginBottom: 12,
          }}
        >
          {chat.messages.length === 0 && (
            <p className={styles.loading} style={{ margin: 0 }}>
              发送一条消息开始调试…
            </p>
          )}
          {chat.messages.map((m) => (
            <DebugMessageItem key={m.id} message={m} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <input
            type="text"
            placeholder="输入消息后发送…"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            style={{ flex: 1, marginBottom: 0, padding: '8px 12px', fontSize: 14, border: '1px solid #dadce0', borderRadius: 4 }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
          />
          <button
            type="button"
            className={listPageStyles.primaryBtn}
            onClick={handleSend}
            disabled={chat.sending}
          >
            {chat.sending ? '发送中...' : '发送'}
          </button>
          <button
            type="button"
            className={listPageStyles.linkBtn}
            onClick={chat.clearMessages}
            disabled={chat.messages.length === 0}
          >
            清空对话
          </button>
        </div>
      </Card>
    </>
  )
}
