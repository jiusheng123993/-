Page({
  data: {
    title: '快速新增',
    description: '快速记录任务、灵感、症状、笔记、错题和临时想法',
    privacyHint: '隐私提示：症状、情绪和私人笔记默认仅本地保存，同步需要单独授权。',
    captureTypes: [
      { title: '任务', description: '记录待办、截止时间和优先级', privacyLevel: 'normal' },
      { title: '灵感', description: '捕捉选题、素材和创意片段', privacyLevel: 'private' },
      { title: '症状', description: '记录身体状态、情绪和能量变化', privacyLevel: 'sensitive' },
      { title: '笔记', description: '保存课堂、会议和复盘要点', privacyLevel: 'private' },
      { title: '错题', description: '记录知识点、错误原因和复习提醒', privacyLevel: 'normal' },
      { title: '临时想法', description: '先收集，稍后整理成行动', privacyLevel: 'private' }
    ]
  }
})
