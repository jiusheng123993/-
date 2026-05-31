import type { PersonaId } from './personaRegistry'

export type PersonaTemplateItem = {
  title: string
  meta: string
  status: string
}

export type PersonaTemplateSection = {
  title: string
  items: PersonaTemplateItem[]
}

export type PersonaTemplate = {
  personaId: PersonaId
  title: string
  operatingRhythm: string
  defaultAction: string
  reviewQuestion: string
  sections: PersonaTemplateSection[]
}

export const personaTemplates: PersonaTemplate[] = [
  {
    personaId: 'exam-student',
    title: '20 天备考冲刺模板',
    operatingRhythm: '每日冲刺 + 隔日复习 + 每周模考复盘',
    defaultAction: '先处理薄弱科目，再安排错题复盘，最后用番茄钟锁定今日冲刺。',
    reviewQuestion: '今天哪个知识点最容易忘，明天要用什么方式复习？',
    sections: [
      {
        title: '科目进度',
        items: [
          { title: '高数极限专题', meta: '薄弱科目 · 正确率 62%', status: '优先冲刺' },
          { title: '英语核心词汇', meta: '记忆回落 · 今日复习 80 词', status: '待复习' }
        ]
      },
      {
        title: '错题复盘',
        items: [
          { title: '洛必达适用条件', meta: '错 3 次 · 需要二次讲解', status: '困难' },
          { title: '阅读长难句定位', meta: '错 2 次 · 明天回看', status: '中等' }
        ]
      },
      {
        title: '复习队列',
        items: [
          { title: '昨天错题回顾', meta: '间隔 1 天 · 今天到期', status: '到期' },
          { title: '本周公式复盘', meta: '间隔 7 天 · 周末完成', status: '排队' }
        ]
      },
      {
        title: '今日冲刺',
        items: [
          { title: '完成 20 道极限题', meta: '60 分钟 · 2 个番茄钟', status: '主任务' },
          { title: '听力精听 1 篇', meta: '30 分钟 · 晚间完成', status: '补强' }
        ]
      }
    ]
  },
  {
    personaId: 'office-worker',
    title: '本周项目推进模板',
    operatingRhythm: '晨间排程 + 会议行动项跟进 + 周五沉淀周报',
    defaultAction: '先确认今日交付，再处理会议行动项，最后记录风险和周报素材。',
    reviewQuestion: '今天哪个事项阻塞了推进，下一步需要谁确认？',
    sections: [
      {
        title: '项目看板',
        items: [
          { title: '首页结构确认', meta: '项目 A · 周三前交付', status: '推进中' },
          { title: 'Electron 打包评估', meta: '技术预研 · 本周输出结论', status: '待确认' }
        ]
      },
      {
        title: '会议行动项',
        items: [
          { title: '补充首页信息架构', meta: '负责人：产品 · DDL：周三', status: '待跟进' },
          { title: '确认设计稿第一版', meta: '负责人：设计 · DDL：周五', status: '待确认' }
        ]
      },
      {
        title: '阻塞风险',
        items: [
          { title: '同步方案未定', meta: '依赖后端接口 · 影响多端计划', status: '风险' },
          { title: 'AI Key 存储策略', meta: '涉及隐私安全 · 需评审', status: '高优先级' }
        ]
      },
      {
        title: '周报素材',
        items: [
          { title: '完成 Persona 场景层', meta: '本周产出 · 可写入周报', status: '已沉淀' },
          { title: '视觉系统升级', meta: '设计质量提升 · 可复盘', status: '已沉淀' }
        ]
      }
    ]
  },
  {
    personaId: 'creator',
    title: '内容创作生产模板',
    operatingRhythm: '灵感收集 + 选题孵化 + 固定发布 + 交付复盘',
    defaultAction: '先从灵感箱挑一个选题，再拆成大纲、草稿、编辑和发布。',
    reviewQuestion: '今天哪个灵感最可能转化成可发布内容？',
    sections: [
      {
        title: '灵感收集箱',
        items: [
          { title: 'AI 行动教练产品观察', meta: '灵感 · 可扩写成长文', status: '待孵化' },
          { title: '效率工具差异化对比', meta: '素材 · 可做图文', status: '可选题' }
        ]
      },
      {
        title: '内容生产线',
        items: [
          { title: '选题大纲', meta: '草稿阶段 · 今天完成', status: '进行中' },
          { title: '封面文案', meta: '发布前检查 · 明天确认', status: '待编辑' }
        ]
      },
      {
        title: '发布日历',
        items: [
          { title: '周三图文发布', meta: '公众号 · 19:30', status: '已排期' },
          { title: '周六视频脚本', meta: '短视频 · 待剪辑', status: '待制作' }
        ]
      },
      {
        title: '客户交付',
        items: [
          { title: '需求确认', meta: '客户 A · 等反馈', status: '等待' },
          { title: '交付清单', meta: '项目 B · 周五提交', status: '待交付' }
        ]
      }
    ]
  },
  {
    personaId: 'self-growth',
    title: '自律成长恢复模板',
    operatingRhythm: '微行动 + 能量记录 + 温柔复盘 + 断后恢复',
    defaultAction: '选择一个最小行动完成，不追求完美连续，优先恢复节奏。',
    reviewQuestion: '今天怎样做能让明天更容易继续？',
    sections: [
      {
        title: '习惯地图',
        items: [
          { title: '阅读 10 分钟', meta: '低压力习惯 · 睡前完成', status: '可完成' },
          { title: '早起记录', meta: '连续 4 天 · 可恢复', status: '观察中' }
        ]
      },
      {
        title: '能量曲线',
        items: [
          { title: '上午精力', meta: '78% · 适合处理主任务', status: '较好' },
          { title: '下午疲劳', meta: '52% · 建议轻任务', status: '偏低' }
        ]
      },
      {
        title: '温柔复盘',
        items: [
          { title: '中断原因', meta: '临时事务打断 · 非失败', status: '已记录' },
          { title: '明日微行动', meta: '只做 10 分钟 · 降低门槛', status: '建议' }
        ]
      },
      {
        title: '成就系统',
        items: [
          { title: '恢复行动', meta: '中断后重新开始 · +20 XP', status: '奖励' },
          { title: '本周复盘', meta: '完成 3 次 · 可升级', status: '接近达成' }
        ]
      }
    ]
  }
]

export const getPersonaTemplateById = (personaId: string): PersonaTemplate =>
  personaTemplates.find((template) => template.personaId === personaId) ?? personaTemplates[0]
