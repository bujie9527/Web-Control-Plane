import type { PlatformCapability } from '@/core/schemas/platformCapability'
import styles from '../PlatformCapabilities.module.css'

export function WorkflowIntegrationTab({ capability }: { capability: PlatformCapability }) {
  return (
    <div className={styles.infoTab}>
      <p>该终端能力与流程节点的对接说明：</p>
      <dl className={styles.dl}>
        <dt>支持的节点执行类型</dt>
        <dd>
          {capability.supportedExecutionTypes?.length
            ? capability.supportedExecutionTypes.join(', ')
            : '—'}
        </dd>
        <dt>支持的节点意图类型</dt>
        <dd>
          {capability.supportedIntentTypes?.length
            ? capability.supportedIntentTypes.join(', ')
            : '—'}
        </dd>
        <dt>绑定的项目类型</dt>
        <dd>
          {capability.supportedProjectTypeIds?.length
            ? capability.supportedProjectTypeIds.join(', ')
            : '—'}
        </dd>
      </dl>
      <p className={styles.hint}>
        在流程模板中，仅当节点 executionType / intentType 与上述范围匹配时，方可选择使用本终端能力执行。
      </p>
    </div>
  )
}
