import styles from './Pagination.module.css'

interface PaginationProps {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
}

const PAGE_SIZE_OPTIONS = [10, 20, 50]

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)

  return (
    <div className={styles.wrapper}>
      <span className={styles.info}>
        共 {total} 条，第 {start}-{end} 条
      </span>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.btn}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          上一页
        </button>
        <span className={styles.page}>
          {page} / {totalPages}
        </span>
        <button
          type="button"
          className={styles.btn}
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          下一页
        </button>
        {onPageSizeChange && (
          <select
            className={styles.select}
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n} 条/页
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  )
}
