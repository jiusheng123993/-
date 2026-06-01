Page({
  data: {
    title: '计划 / 任务 / 日程',
    description: '管理任务、日程、目标、优先级和轻量复盘',
    tasks: [
      { title: '完成今日主线任务', meta: '高优先级 · 60 分钟', status: '进行中' },
      { title: '整理会议行动项', meta: '负责人 · 截止时间', status: '待处理' },
      { title: '晚间轻量复盘', meta: '10 分钟 · 可恢复', status: '稍后' }
    ],
    goals: [
      { title: '学习冲刺', progress: 72, meta: '薄弱点优先' },
      { title: '项目交付', progress: 56, meta: '风险前置' }
    ],
    schedule: [
      { time: '09:00', title: '今日计划' },
      { time: '14:00', title: '专注执行' },
      { time: '21:30', title: '复盘整理' }
    ],
    reviewPrompts: ['今天最重要的完成是什么？', '哪个任务被卡住了？', '明天最小下一步是什么？']
  }
})
