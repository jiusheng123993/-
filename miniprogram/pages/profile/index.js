const blueprint = require('../../../shared/blueprint.json')

Page({
  data: {
    title: '我的',
    theme: '轻多巴胺年轻感',
    syncStrategy: blueprint.syncStrategy,
    settings: ['主题中心', '隐私设置', '本地导出', '删除数据', '同步预留']
  }
})
