const blueprint = require('../../../shared/blueprint.json')

const privacyLevelLabels = {
  normal: '普通',
  private: '私密',
  sensitive: '敏感'
}

const availableNowIds = ['mobile-workbench', 'planner', 'quick-capture', 'focus-checkin', 'review-stats']
const enabledModules = blueprint.modules.filter((module) => module.defaultEnabled)
const moduleCards = blueprint.modules.map((module) => ({
  ...module,
  privacyLabel: privacyLevelLabels[module.privacyLevel],
  availableNow: availableNowIds.includes(module.id),
  availabilityLabel: availableNowIds.includes(module.id) ? '可用' : '预留'
}))

Page({
  data: {
    modules: moduleCards,
    enabledCount: enabledModules.length,
    totalCount: blueprint.modules.length,
    privacyLevelLabels,
    moduleGroups: [
      {
        title: '核心闭环',
        description: '首页、计划、快速新增、专注和复盘保证第一版可独立使用。',
        modules: moduleCards.filter((module) => availableNowIds.includes(module.id))
      },
      {
        title: '扩展与治理',
        description: '模块中心、主题、隐私和同步先保留入口，后续逐步开放。',
        modules: moduleCards.filter((module) => !availableNowIds.includes(module.id))
      }
    ]
  }
})
