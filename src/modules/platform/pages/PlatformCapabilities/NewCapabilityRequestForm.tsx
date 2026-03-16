/**
 * 新终端能力接入申请表单（P2-B）
 * 用于申请接入新终端能力，需填写与工作流对接的声明字段
 */
import { useState } from 'react'
import type { CapabilityProtocol } from '@/core/schemas/platformCapability'
import styles from './PlatformCapabilities.module.css'

const PROTOCOL_OPTIONS: { value: CapabilityProtocol; label: string }[] = [
  { value: 'oauth2', label: 'OAuth2' },
  { value: 'api_key', label: 'API Key' },
  { value: 'webhook', label: 'Webhook' },
  { value: 'browser_automation', label: '浏览器自动化' },
  { value: 'mcp', label: 'MCP' },
]

export interface NewCapabilityRequestFormProps {
  onClose: () => void
  onSubmit?: (data: NewCapabilityRequestData) => void
}

export interface NewCapabilityRequestData {
  code: string
  nameZh: string
  description: string
  protocolType: CapabilityProtocol
  authType: 'oauth2' | 'api_key' | 'none'
  supportedProjectTypeIds: string
  supportedExecutionTypes: string
  supportedIntentTypes: string
  requestReason: string
  documentUrl?: string
}

export function NewCapabilityRequestForm({ onClose, onSubmit }: NewCapabilityRequestFormProps) {
  const [code, setCode] = useState('')
  const [nameZh, setNameZh] = useState('')
  const [description, setDescription] = useState('')
  const [protocolType, setProtocolType] = useState<CapabilityProtocol>('oauth2')
  const [authType, setAuthType] = useState<'oauth2' | 'api_key' | 'none'>('oauth2')
  const [supportedProjectTypeIds, setSupportedProjectTypeIds] = useState('')
  const [supportedExecutionTypes, setSupportedExecutionTypes] = useState('agent_task,result_writer')
  const [supportedIntentTypes, setSupportedIntentTypes] = useState('publish,record,create')
  const [requestReason, setRequestReason] = useState('')
  const [documentUrl, setDocumentUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim() || !nameZh.trim() || !requestReason.trim()) return
    setSubmitting(true)
    try {
      const data: NewCapabilityRequestData = {
        code: code.trim(),
        nameZh: nameZh.trim(),
        description: description.trim(),
        protocolType,
        authType,
        supportedProjectTypeIds: supportedProjectTypeIds.trim(),
        supportedExecutionTypes: supportedExecutionTypes.trim(),
        supportedIntentTypes: supportedIntentTypes.trim(),
        requestReason: requestReason.trim(),
        documentUrl: documentUrl.trim() || undefined,
      }
      onSubmit?.(data)
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.requestForm}>
      <h3>申请接入新终端能力</h3>
      <p className={styles.hint}>
        填写以下信息后提交申请，平台将审核并与工作流概念对接。code 需全局唯一，格式建议 snake_case。
      </p>
      <form onSubmit={handleSubmit}>
        <div className={styles.formRow}>
          <label>能力编码 (code) *</label>
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="例如 my_platform_api" required />
        </div>
        <div className={styles.formRow}>
          <label>中文名称 *</label>
          <input value={nameZh} onChange={(e) => setNameZh(e.target.value)} placeholder="例如 XX 平台 API" required />
        </div>
        <div className={styles.formRow}>
          <label>描述</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="能力说明" />
        </div>
        <div className={styles.formRow}>
          <label>协议类型</label>
          <select value={protocolType} onChange={(e) => setProtocolType(e.target.value as CapabilityProtocol)}>
            {PROTOCOL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className={styles.formRow}>
          <label>认证方式</label>
          <select value={authType} onChange={(e) => setAuthType(e.target.value as 'oauth2' | 'api_key' | 'none')}>
            <option value="oauth2">OAuth2</option>
            <option value="api_key">API Key</option>
            <option value="none">无</option>
          </select>
        </div>
        <div className={styles.formRow}>
          <label>支持的项目类型 ID（逗号分隔）</label>
          <input value={supportedProjectTypeIds} onChange={(e) => setSupportedProjectTypeIds(e.target.value)} placeholder="project-type-social" />
        </div>
        <div className={styles.formRow}>
          <label>支持的节点执行类型（逗号分隔）</label>
          <input value={supportedExecutionTypes} onChange={(e) => setSupportedExecutionTypes(e.target.value)} placeholder="agent_task, result_writer" />
        </div>
        <div className={styles.formRow}>
          <label>支持的节点意图类型（逗号分隔）</label>
          <input value={supportedIntentTypes} onChange={(e) => setSupportedIntentTypes(e.target.value)} placeholder="publish, record, create" />
        </div>
        <div className={styles.formRow}>
          <label>申请理由 *</label>
          <textarea value={requestReason} onChange={(e) => setRequestReason(e.target.value)} rows={3} required placeholder="说明接入该能力的业务场景与必要性" />
        </div>
        <div className={styles.formRow}>
          <label>文档链接</label>
          <input value={documentUrl} onChange={(e) => setDocumentUrl(e.target.value)} placeholder="https://..." type="url" />
        </div>
        <div className={styles.formActions}>
          <button type="button" onClick={onClose}>取消</button>
          <button type="submit" disabled={submitting}>{submitting ? '提交中…' : '提交申请'}</button>
        </div>
      </form>
    </div>
  )
}
