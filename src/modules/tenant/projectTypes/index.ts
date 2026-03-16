/**
 * 项目类型配置包聚合入口
 * 每个子目录对应一种项目类型，包含：config / goalTypes / metricOptions
 * 新增项目类型时，在此处添加导入并合并到导出数组中
 */
import { socialMediaProjectType } from './social-media/config'
import { socialMediaGoalTypes } from './social-media/goalTypes'
import { socialMediaMetricOptions } from './social-media/metricOptions'

import { matrixProjectType } from './matrix/config'
import { matrixGoalTypes } from './matrix/goalTypes'
import { matrixMetricOptions } from './matrix/metricOptions'

import { seoProjectType } from './seo/config'
import { seoGoalTypes } from './seo/goalTypes'
import { seoMetricOptions } from './seo/metricOptions'

import { leadGenProjectType } from './lead-gen/config'
import { leadGenGoalTypes } from './lead-gen/goalTypes'
import { leadGenMetricOptions } from './lead-gen/metricOptions'

import { facebookPageProjectType } from './facebook-page/config'
import { facebookPageGoalTypes } from './facebook-page/goalTypes'
import { facebookPageMetricOptions } from './facebook-page/metricOptions'

export const ALL_PROJECT_TYPES = [
  socialMediaProjectType,
  matrixProjectType,
  seoProjectType,
  leadGenProjectType,
  facebookPageProjectType,
]

export const ALL_GOAL_TYPES = [
  ...socialMediaGoalTypes,
  ...matrixGoalTypes,
  ...seoGoalTypes,
  ...leadGenGoalTypes,
  ...facebookPageGoalTypes,
]

export const ALL_METRIC_OPTIONS = [
  ...socialMediaMetricOptions,
  ...matrixMetricOptions,
  ...seoMetricOptions,
  ...leadGenMetricOptions,
  ...facebookPageMetricOptions,
]
