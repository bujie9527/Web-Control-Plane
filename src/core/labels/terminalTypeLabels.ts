import type { SystemTerminalTypeCategory, SystemTerminalTypeStatus } from '@/modules/platform/schemas/systemTerminalType'

export const TERMINAL_TYPE_CATEGORY_LABELS: Record<SystemTerminalTypeCategory, string> = {
  api: 'API 接口',
  browser: '浏览器控制',
  mcp: 'MCP 系统控制',
}

export const TERMINAL_TYPE_STATUS_LABELS: Record<SystemTerminalTypeStatus, string> = {
  active: '已启用',
  disabled: '已停用',
}

/** 终端实例运行状态标签（active/inactive/error/testing） */
export const TERMINAL_STATUS_LABELS: Record<string, string> = {
  active: '正常',
  inactive: '未激活',
  error: '异常',
  testing: '测试中',
}

/** 终端测试结果标签 */
export const TERMINAL_TEST_RESULT_LABELS: Record<string, string> = {
  success: '成功',
  failed: '失败',
  unknown: '未知',
}

/** 终端实例状态 → StatusTag 类型映射 */
export const TERMINAL_STATUS_TAG_MAP: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = {
  active: 'success',
  inactive: 'warning',
  error: 'error',
  testing: 'neutral',
}
