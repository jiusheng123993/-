const blueprint = require('../../../shared/blueprint.json')

Page({
  data: {
    blueprint,
    modules: blueprint.modules.slice(0, 4),
    primaryAction: '优先做 3 件事',
    priorities: [
      { title: '完成今日主线任务', meta: '60 分钟 · 高优先级', tag: '计划' },
      { title: '番茄专注一轮', meta: '25 分钟 · 立即开始', tag: '专注' },
      { title: '睡前轻量复盘', meta: '10 分钟 · 低压力', tag: '复盘' }
    ],
    shortcuts: [
      { title: '任务', value: '2 待办' },
      { title: '专注', value: '25:00' },
      { title: '记录', value: '快速写入' },
      { title: '统计', value: '今日趋势' }
    ],
    energyStatus: {
      title: '低压力恢复',
      description: '状态一般时，先完成一个 10 分钟可恢复行动。'
    },
    reviewSummary: {
      title: '今日复盘',
      description: '记录完成、卡点和明天最小下一步。'
    }
  }
})
