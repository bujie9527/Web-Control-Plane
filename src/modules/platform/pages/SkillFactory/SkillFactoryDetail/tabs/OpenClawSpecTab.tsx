import { Card } from '@/components/Card/Card'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import type { Skill } from '@/modules/platform/schemas/skill'
import styles from '../../SkillFactory.module.css'

interface Props {
  skill: Skill
}

export function OpenClawSpecTab({ skill }: Props) {
  const spec = skill.openClawSpec
  const hasSpec = spec && (
    (spec.steps && spec.steps.length > 0) ||
    spec.inputSchemaJson ||
    spec.outputSchemaJson
  )

  if (!hasSpec) {
    return (
      <Card title="OpenClaw 结构" description="与 OpenClaw 格式兼容的执行规范">
        <EmptyState
          title="暂未配置 OpenClaw 结构"
          description="该 Skill 尚未提供 OpenClaw 兼容的执行规范，可在编辑页补充"
        />
      </Card>
    )
  }

  return (
    <>
      {spec.steps && spec.steps.length > 0 && (
        <Card title="执行步骤（Steps）" description="该 Skill 的结构化执行步骤">
          <ol className={styles.stepList}>
            {spec.steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </Card>
      )}

      {spec.inputSchemaJson && (
        <Card title="输入 Schema（Input Schema）" description="Skill 执行时接受的输入结构">
          <pre className={styles.specBlock}>{spec.inputSchemaJson}</pre>
        </Card>
      )}

      {spec.outputSchemaJson && (
        <Card title="输出 Schema（Output Schema）" description="Skill 执行结果的输出结构">
          <pre className={styles.specBlock}>{spec.outputSchemaJson}</pre>
        </Card>
      )}
    </>
  )
}
