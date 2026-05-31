const blueprint = require('../../../shared/blueprint.json')

Page({
  data: {
    blueprint,
    modules: blueprint.modules.slice(0, 4),
    primaryAction: '优先做 3 件事'
  }
})
