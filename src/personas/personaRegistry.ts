import type { AiTaskKind } from '../ai/aiProvider'
import type { ThemeId } from '../themes/themeRegistry'

export type PersonaId = 'exam-student' | 'office-worker' | 'creator' | 'self-growth'

export type ScenarioModule = {
  id: string
  title: string
  description: string
  signal: string
}

export type PersonaScenario = {
  id: PersonaId
  name: string
  targetUser: string
  painPoint: string
  primaryFlow: string
  hero: string
  mainModuleTitle: string
  sideModuleTitle: string
  aiRole: string
  keyMetrics: string[]
  modules: ScenarioModule[]
  aiActions: AiTaskKind[]
  recommendedThemeId: ThemeId
}

export const personaRegistry: PersonaScenario[] = [
  {
    id: 'exam-student',
    name: '学生备考',
    targetUser: '高中生、大学生、考研、考公、考证和四六级备考用户',
    painPoint: '计划容易断、复习容易忘、错题难闭环、专注和目标脱节。',
    primaryFlow: '考试倒计时 → 科目进度 → 今日冲刺 → 错题复盘 → 复习队列',
    hero: '围绕考试倒计时，把科目进度、错题复盘和专注学习串成备考闭环。',
    mainModuleTitle: '考试冲刺计划',
    sideModuleTitle: '复习队列',
    aiRole: 'AI 备考教练',
    keyMetrics: ['考试倒计时', '今日学习时长', '复习完成率', '错题闭环率'],
    modules: [
      {
        id: 'countdown',
        title: '考试倒计时',
        description: '把长期考试目标压缩成每日可执行冲刺任务。',
        signal: '20 天'
      },
      {
        id: 'subject-progress',
        title: '科目进度',
        description: '按科目查看薄弱项、进度和今日优先级。',
        signal: '高数 72%'
      },
      {
        id: 'mistake-review',
        title: '错题复盘',
        description: '把错题变成复习提醒，而不是堆在笔记里。',
        signal: '8 题待复盘'
      },
      {
        id: 'review-queue',
        title: '复习队列',
        description: '把今天、明天、本周要复习的知识点排成队列。',
        signal: '2 个今日到期'
      }
    ],
    aiActions: ['daily-plan', 'task-breakdown', 'daily-review'],
    recommendedThemeId: 'minimal-premium'
  },
  {
    id: 'office-worker',
    name: '职场办公',
    targetUser: '上班族、产品、运营、项目助理、管理者和需要推进协作的人',
    painPoint: '会议后没人跟进、临时任务打乱计划、周报难写、风险阻塞不透明。',
    primaryFlow: '会议记录 → 行动项 → 项目推进 → 阻塞风险 → 周报素材',
    hero: '把会议、项目、临时任务和周报素材变成可追踪的办公行动系统。',
    mainModuleTitle: '项目推进看板',
    sideModuleTitle: '会议行动项',
    aiRole: 'AI 项目助理',
    keyMetrics: ['今日待交付数', '逾期风险数', '会议行动项完成率', '本周产出数'],
    modules: [
      {
        id: 'project-board',
        title: '项目推进看板',
        description: '按待处理、推进中、待确认、已完成跟踪项目事项。',
        signal: '5 项推进中'
      },
      {
        id: 'meeting-actions',
        title: '会议行动项',
        description: '从会议记录里提取负责人、截止时间和交付物。',
        signal: '3 项待跟进'
      },
      {
        id: 'risk-blockers',
        title: '阻塞风险',
        description: '把延期、依赖和不确定事项提前暴露出来。',
        signal: '2 个风险'
      },
      {
        id: 'weekly-materials',
        title: '周报素材',
        description: '自动沉淀本周完成、问题、风险和下周计划。',
        signal: '6 条素材'
      }
    ],
    aiActions: ['meeting-actions', 'weekly-report', 'task-breakdown'],
    recommendedThemeId: 'business-bluegray'
  },
  {
    id: 'creator',
    name: '内容创作',
    targetUser: '自媒体、写作者、设计师、视频创作者、独立开发者和自由职业者',
    painPoint: '灵感分散、选题难持续、创作进度不稳定、交付和发布节奏混乱。',
    primaryFlow: '灵感收集 → 选题孵化 → 内容生产 → 发布日历 → 项目交付',
    hero: '把零散灵感、选题、创作任务和发布节奏组织成内容生产线。',
    mainModuleTitle: '内容生产线',
    sideModuleTitle: '灵感收集箱',
    aiRole: 'AI 选题策划',
    keyMetrics: ['本周发布数', '选题转化率', '创作进度', '交付倒计时'],
    modules: [
      {
        id: 'idea-inbox',
        title: '灵感收集箱',
        description: '快速收纳标题、片段、素材和突然冒出的想法。',
        signal: '12 条灵感'
      },
      {
        id: 'content-pipeline',
        title: '内容生产线',
        description: '把选题拆成大纲、草稿、编辑、发布多个阶段。',
        signal: '4 篇生产中'
      },
      {
        id: 'publish-calendar',
        title: '发布日历',
        description: '按平台和日期安排发布节奏，避免断更。',
        signal: '3 天后发布'
      },
      {
        id: 'client-delivery',
        title: '客户交付',
        description: '跟踪接单、需求、反馈、交付和尾款节点。',
        signal: '1 个待交付'
      }
    ],
    aiActions: ['task-breakdown', 'daily-plan', 'weekly-report'],
    recommendedThemeId: 'healing-anime'
  },
  {
    id: 'self-growth',
    name: '自律成长',
    targetUser: '想坚持阅读、早起、健身、写作、复盘和长期习惯养成的人',
    painPoint: '打卡容易断、断了就放弃、长期目标太抽象、复盘写不下去。',
    primaryFlow: '微习惯 → 今日打卡 → 能量记录 → 温柔复盘 → 成长成就',
    hero: '用低压力习惯地图和温柔复盘，让成长在断续中也能继续。',
    mainModuleTitle: '习惯地图',
    sideModuleTitle: '温柔复盘',
    aiRole: 'AI 成长陪伴',
    keyMetrics: ['连续天数', '习惯完成率', '能量趋势', '每周复盘次数'],
    modules: [
      {
        id: 'habit-map',
        title: '习惯地图',
        description: '把长期目标拆成低压力、可恢复的微习惯。',
        signal: '4 个习惯'
      },
      {
        id: 'energy-curve',
        title: '能量曲线',
        description: '记录每天的精力、情绪和任务完成关系。',
        signal: '今日 78%'
      },
      {
        id: 'gentle-review',
        title: '温柔复盘',
        description: '关注为什么中断，以及明天怎么更容易继续。',
        signal: '3 个问题'
      },
      {
        id: 'achievement-wall',
        title: '成就系统',
        description: '把连续行动、恢复行动和阶段突破都变成正反馈。',
        signal: '23 个成就'
      }
    ],
    aiActions: ['daily-review', 'daily-plan', 'task-breakdown'],
    recommendedThemeId: 'cream-dopamine'
  }
]

export const getPersonaById = (personaId: string): PersonaScenario =>
  personaRegistry.find((persona) => persona.id === personaId) ?? personaRegistry[0]
