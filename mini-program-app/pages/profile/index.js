const blueprint = require('../../../shared/blueprint.json')

Page({
  data: {
    title: '我的',
    theme: '轻多巴胺年轻感',
    syncStrategy: blueprint.syncStrategy,
    syncStatus: '本地优先 · 同步预留',
    sensitiveDataNotice: '健康、症状、情绪、私人笔记等敏感数据默认仅本地保存，开启同步前必须单独授权。',
    privacyControls: [
      { title: '隐私锁', description: '进入敏感模块前再次确认身份', status: '预留' },
      { title: '敏感数据本地保存', description: '症状、情绪、私人笔记不默认上传', status: '已启用' },
      { title: '日志脱敏', description: '错误记录不包含原始私人内容', status: '已启用' }
    ],
    dataActions: [
      { title: '本地导出', description: '导出任务、笔记、复盘和模块配置', risk: '低风险' },
      { title: '同步预留', description: '未来接入云同步 Provider，默认关闭', risk: '需授权' },
      { title: '删除数据', description: '清除本机记录前必须二次确认', risk: '高风险 · 二次确认' }
    ],
    settings: ['主题中心', '隐私设置', '本地导出', '删除数据', '同步预留']
  }
})
