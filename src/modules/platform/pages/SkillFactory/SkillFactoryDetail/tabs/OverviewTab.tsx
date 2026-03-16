import { Card } from '@/components/Card/Card'
import type { Skill } from '@/modules/platform/schemas/skill'
import {
  SKILL_STATUS_LABELS,
  SKILL_CATEGORY_LABELS,
  SKILL_EXECUTION_TYPE_LABELS,
} from '@/core/labels/skillLabels'
import styles from '../../SkillFactory.module.css'

interface Props {
  skill: Skill
}

export function OverviewTab({ skill }: Props) {
  return (
    <>
      <Card title="基础信息" description="技能的基本属性与说明">
        <dl className={styles.dl}>
          <dt>中文名称</dt>
          <dd>{skill.nameZh ?? skill.name}</dd>
          <dt>英文名称</dt>
          <dd>{skill.name}</dd>
          <dt>编码</dt>
          <dd>{skill.code}</dd>
          <dt>业务分类</dt>
          <dd>{SKILL_CATEGORY_LABELS[skill.category] ?? skill.category}</dd>
          <dt>执行类型</dt>
          <dd>{SKILL_EXECUTION_TYPE_LABELS[skill.executionType] ?? skill.executionType}</dd>
          <dt>版本</dt>
          <dd>{skill.version}</dd>
          <dt>状态</dt>
          <dd>{SKILL_STATUS_LABELS[skill.status]}</dd>
          <dt>系统预置</dt>
          <dd>{skill.isSystemPreset ? '是（不可删除）' : '否'}</dd>
          {skill.description && (
            <>
              <dt>能力说明</dt>
              <dd>{skill.description}</dd>
            </>
          )}
          <dt>绑定 Agent 数</dt>
          <dd>{skill.boundAgentTemplateIds?.length ?? 0}</dd>
          <dt>创建时间</dt>
          <dd>{skill.createdAt.slice(0, 19).replace('T', ' ')}</dd>
          <dt>更新时间</dt>
          <dd>{skill.updatedAt.slice(0, 19).replace('T', ' ')}</dd>
        </dl>
      </Card>
    </>
  )
}
