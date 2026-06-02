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
  },
  {
    personaId: 'grad-exam',
    title: '考研冲刺模板',
    operatingRhythm: '每日科目轮换 + 周末模考 + 月度复盘',
    defaultAction: '先完成今日核心科目任务，再处理错题复盘，最后规划明天优先级。',
    reviewQuestion: '今天哪个科目进度落后了，明天如何调整时间分配？',
    sections: [
      {
        title: '科目规划',
        items: [
          { title: '政治马原', meta: '薄弱科目 · 进度 45%', status: '优先冲刺' },
          { title: '英语阅读', meta: '稳定提升 · 正确率 72%', status: '保持' }
        ]
      },
      {
        title: '真题训练',
        items: [
          { title: '2019 年数学真题', meta: '已完成 · 得分 118', status: '已复盘' },
          { title: '2020 年英语真题', meta: '待完成 · 明天模考', status: '待做' }
        ]
      },
      {
        title: '错题复盘',
        items: [
          { title: '高数极限专题', meta: '错 3 次 · 需二次巩固', status: '困难' },
          { title: '英语长难句', meta: '错 2 次 · 明天回看', status: '中等' }
        ]
      },
      {
        title: '今日冲刺',
        items: [
          { title: '完成政治 100 题', meta: '90 分钟 · 3 个番茄钟', status: '主任务' },
          { title: '背诵英语作文模板', meta: '30 分钟 · 晚间完成', status: '补强' }
        ]
      }
    ]
  },
  {
    personaId: 'civil-service',
    title: '考公备战模板',
    operatingRhythm: '每日行测 + 申论积累 + 周末面试模拟',
    defaultAction: '先完成行测专项训练，再积累申论素材，最后记录今日疑难点。',
    reviewQuestion: '今天行测哪个模块正确率最低，申论素材积累了多少？',
    sections: [
      {
        title: '行测训练',
        items: [
          { title: '言语理解 40 题', meta: '正确率 78% · 目标 85%', status: '进行中' },
          { title: '数量关系 15 题', meta: '正确率 55% · 需加强', status: '薄弱' }
        ]
      },
      {
        title: '申论积累',
        items: [
          { title: '热点素材：乡村振兴', meta: '已整理 · 3 个案例', status: '已积累' },
          { title: '范文模板：议论文', meta: '待学习 · 明天开始', status: '待做' }
        ]
      },
      {
        title: '面试模拟',
        items: [
          { title: '结构化面试：自我介绍', meta: '已模拟 · 评分 85', status: '良好' },
          { title: '无领导小组讨论', meta: '待模拟 · 周末安排', status: '待做' }
        ]
      },
      {
        title: '岗位追踪',
        items: [
          { title: '目标岗位 A', meta: '竞争比 120:1 · 持续关注', status: '关注中' },
          { title: '目标岗位 B', meta: '竞争比 80:1 · 符合条件', status: '备选' }
        ]
      }
    ]
  },
  {
    personaId: 'cert-exam',
    title: '考证管理模板',
    operatingRhythm: '证书轮换 + 章节推进 + 考前冲刺',
    defaultAction: '先查看今日证书学习计划，再按章节推进，最后做章节测试。',
    reviewQuestion: '今天完成了几个章节，哪个证书进度最紧急？',
    sections: [
      {
        title: '证书规划',
        items: [
          { title: 'PMP 认证', meta: '进度 60% · 考试还有 45 天', status: '进行中' },
          { title: 'CFA 一级', meta: '进度 30% · 考试还有 90 天', status: '规划中' }
        ]
      },
      {
        title: '章节学习',
        items: [
          { title: 'PMP 第 5 章：范围管理', meta: '已完成 · 测试 85%', status: '已掌握' },
          { title: 'CFA 第 3 章：财务报表', meta: '进行中 · 预计 3 天', status: '学习中' }
        ]
      },
      {
        title: '模拟考试',
        items: [
          { title: 'PMP 模拟考 1', meta: '上次 78 分 · 目标 80', status: '待提升' },
          { title: 'CFA 章节测试', meta: '上次 82 分 · 目标 85', status: '良好' }
        ]
      },
      {
        title: '资料管理',
        items: [
          { title: 'PMP 教材笔记', meta: '已整理 · 15 份', status: '已归档' },
          { title: 'CFA 网课视频', meta: '已观看 · 第 3 章', status: '进行中' }
        ]
      }
    ]
  },
  {
    personaId: 'english-cet',
    title: '四六级冲刺模板',
    operatingRhythm: '每日词汇 + 听力精听 + 阅读训练 + 写作模板',
    defaultAction: '先背诵今日词汇，再精听一篇听力，然后做两篇阅读，最后积累写作素材。',
    reviewQuestion: '今天背了多少单词，听力正确率如何，写作模板积累了多少？',
    sections: [
      {
        title: '词汇积累',
        items: [
          { title: '高频词汇 100 个', meta: '已掌握 2800/4500', status: '进行中' },
          { title: '词根词缀记忆', meta: '本周目标 50 个', status: '待完成' }
        ]
      },
      {
        title: '听力训练',
        items: [
          { title: '2019 年 6 月听力', meta: '正确率 75% · 目标 80%', status: '待提升' },
          { title: '精听练习：新闻听力', meta: '已完成 · 3 篇', status: '良好' }
        ]
      },
      {
        title: '阅读提速',
        items: [
          { title: '长篇阅读 2 篇', meta: '平均 8 分钟/篇 · 目标 6 分钟', status: '进行中' },
          { title: '仔细阅读 4 篇', meta: '正确率 70% · 目标 80%', status: '待提升' }
        ]
      },
      {
        title: '写作模板',
        items: [
          { title: '议论文模板', meta: '已积累 5 个 · 目标 10 个', status: '进行中' },
          { title: '图表作文模板', meta: '已积累 3 个 · 目标 5 个', status: '待完成' }
        ]
      }
    ]
  }
]

export const getPersonaTemplateById = (personaId: string): PersonaTemplate =>
  personaTemplates.find((template) => template.personaId === personaId) ?? personaTemplates[0]
