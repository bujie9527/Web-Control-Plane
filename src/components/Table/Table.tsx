import styles from './Table.module.css'

export interface TableColumn<T = unknown> {
  key: string
  title: string | React.ReactNode
  width?: string | number
  render?: (value: unknown, record: T) => React.ReactNode
}

interface TableProps<T = unknown> {
  columns: TableColumn<T>[]
  dataSource: T[]
  rowKey: keyof T | ((record: T) => string)
  loading?: boolean
  emptyText?: string
  loadingText?: string
}

export function Table<T extends object>({
  columns,
  dataSource,
  rowKey,
  loading = false,
  emptyText = '暂无数据',
  loadingText = '加载中...',
}: TableProps<T>) {
  const getKey = (record: T) =>
    typeof rowKey === 'function' ? rowKey(record) : String(record[rowKey] ?? '')

  if (loading) {
    return (
      <div className={styles.wrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} style={col.width ? { width: col.width } : undefined}>
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>
        </table>
        <div className={styles.loading}>{loadingText}</div>
      </div>
    )
  }

  if (!dataSource.length) {
    return (
      <div className={styles.wrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} style={col.width ? { width: col.width } : undefined}>
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>
        </table>
        <div className={styles.empty}>{emptyText}</div>
      </div>
    )
  }

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={col.width ? { width: col.width } : undefined}>
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataSource.map((record) => (
            <tr key={getKey(record)}>
              {columns.map((col) => (
                <td key={col.key}>
                  {col.render
                    ? col.render((record as Record<string, unknown>)[col.key], record)
                    : String((record as Record<string, unknown>)[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
