/**
 * 统一 API 合约类型，与 06-api-contract-spec 一致
 * 所有模块 list/detail/create/update 等均使用此结构
 */

export interface PaginationMeta {
  page: number
  pageSize: number
  total: number
}

export interface ListResult<T> {
  items: T[]
  total: number
}

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
  meta?: {
    requestId?: string
    timestamp?: string
    pagination?: PaginationMeta
  }
}
