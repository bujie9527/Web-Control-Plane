import type { PlatformCapability } from '@/core/schemas/platformCapability'
import styles from '../PlatformCapabilities.module.css'

export function CapabilityInfoTab({ capability }: { capability: PlatformCapability }) {
  return (
    <div className={styles.infoTab}>
      <dl className={styles.dl}>
        <dt>编码</dt>
        <dd>{capability.code}</dd>
        <dt>英文名</dt>
        <dd>{capability.name}</dd>
        <dt>协议类型</dt>
        <dd>{capability.protocolType}</dd>
        <dt>认证方式</dt>
        <dd>{capability.authType}</dd>
        <dt>是否内置</dt>
        <dd>{capability.isBuiltIn ? '是' : '否'}</dd>
      </dl>
      {capability.configFields?.length > 0 && (
        <section>
          <h4>配置字段</h4>
          <ul className={styles.configFields}>
            {capability.configFields.map((f) => (
              <li key={f.key}>
                <strong>{f.label}</strong> ({f.type}, {f.required ? '必填' : '选填'})
                {f.description && ` — ${f.description}`}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
