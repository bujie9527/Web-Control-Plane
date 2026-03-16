/**
 * 服务端 LLM 错误映射（Phase 17.7a）
 * 将 API/Provider 错误统一转换为中文可读错误
 */
export function mapOpenAIErrorToZh(
  status: number,
  bodyMessage?: string
): { errorCode: string; errorMessageZh: string } {
  switch (status) {
    case 401:
      return { errorCode: 'OPENAI_401', errorMessageZh: '测试连接失败：密钥无效或未授权' }
    case 429:
      return { errorCode: 'OPENAI_429', errorMessageZh: '测试连接失败：请求频率超限' }
    case 500:
    case 502:
    case 503:
      return { errorCode: `OPENAI_${status}`, errorMessageZh: '测试连接失败：模型服务暂时不可用' }
    default:
      return {
        errorCode: `OPENAI_${status}`,
        errorMessageZh: bodyMessage ? `测试连接失败：${bodyMessage}` : `测试连接失败：接口返回 ${status}`,
      }
  }
}

export function mapNetworkErrorToZh(msg: string): { errorCode: string; errorMessageZh: string } {
  if (/timeout|ETIMEDOUT/i.test(msg)) {
    return { errorCode: 'NETWORK_TIMEOUT', errorMessageZh: '测试连接失败：请求超时' }
  }
  if (/ENOTFOUND|ECONNREFUSED|fetch failed/i.test(msg)) {
    return { errorCode: 'NETWORK_UNREACHABLE', errorMessageZh: '测试连接失败：接口不可达' }
  }
  return { errorCode: 'NETWORK_ERROR', errorMessageZh: `测试连接失败：${msg.slice(0, 80)}` }
}
