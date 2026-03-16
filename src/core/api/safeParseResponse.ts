/**
 * 安全解析 Response 为 JSON，避免服务端返回非 JSON（如 HTML 错误页）时抛出 Unexpected end of JSON input
 */
export async function parseResponseJson<T>(res: Response): Promise<T> {
  try {
    return (await res.json()) as T
  } catch {
    throw new Error(
      `服务器响应异常（HTTP ${res.status}），请检查后端是否正常运行`
    )
  }
}
