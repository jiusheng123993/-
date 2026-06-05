import type { Module } from './types'

export const defaultModules: Module[] = [
  {
    id: 'today-tasks',
    title: '今日任务',
    description: '查看和管理今日待办事项',
    icon: 'CheckCircle',
    category: 'productivity',
    size: { columns: 2, rows: 1 },
    isDefault: true,
    isCustom: false
  },
  {
    id: 'focus-timer',
    title: '专注计时',
    description: '番茄工作法专注计时',
    icon: 'Clock',
    category: 'productivity',
    size: { columns: 1, rows: 1 },
    isDefault: true,
    isCustom: false
  },
  {
    id: 'calendar',
    title: '日历',
    description: '查看日程安排',
    icon: 'Calendar',
    category: 'productivity',
    size: { columns: 2, rows: 1 },
    isDefault: true,
    isCustom: false
  },
  {
    id: 'notes',
    title: '笔记',
    description: '快速记录想法和笔记',
    icon: 'FileText',
    category: 'productivity',
    size: { columns: 2, rows: 1 },
    isDefault: true,
    isCustom: false
  },
  {
    id: 'weather',
    title: '天气',
    description: '查看当地天气',
    icon: 'Cloud',
    category: 'life',
    size: { columns: 1, rows: 1 },
    isDefault: true,
    isCustom: false
  },
  {
    id: 'statistics',
    title: '数据统计',
    description: '查看个人数据统计',
    icon: 'BarChart',
    category: 'productivity',
    size: { columns: 2, rows: 2 },
    isDefault: true,
    isCustom: false
  },
  {
    id: 'persona-plan',
    title: '考试冲刺计划',
    description: '按当前身份展示主行动计划和复盘节奏',
    icon: 'BookOpen',
    category: 'learning',
    size: { columns: 2, rows: 2 },
    isDefault: true,
    isCustom: false
  },
  {
    id: 'growth-rpg',
    title: '成长等级',
    description: '展示经验、连续天数和成就进度',
    icon: 'Crown',
    category: 'productivity',
    size: { columns: 2, rows: 1 },
    isDefault: true,
    isCustom: false
  },
  {
    id: 'focus-overview',
    title: '桌面专注概览',
    description: '汇总本周进度、待办数量和计划分钟',
    icon: 'Clock',
    category: 'productivity',
    size: { columns: 2, rows: 2 },
    isDefault: true,
    isCustom: false
  },
  {
    id: 'key-metrics',
    title: '关键指标',
    description: '展示当前场景最重要的成长指标',
    icon: 'BarChart',
    category: 'productivity',
    size: { columns: 2, rows: 1 },
    isDefault: true,
    isCustom: false
  },
  {
    id: 'today-actions',
    title: '今日行动',
    description: '展示今日待办、完成状态和行动入口',
    icon: 'CheckCircle',
    category: 'productivity',
    size: { columns: 2, rows: 1 },
    isDefault: true,
    isCustom: false
  },
  {
    id: 'focus-session',
    title: '任务专注',
    description: '为当前任务启动专注计时器',
    icon: 'Clock',
    category: 'productivity',
    size: { columns: 2, rows: 1 },
    isDefault: true,
    isCustom: false
  },
  {
    id: 'focus-history',
    title: '最近专注',
    description: '查看最近完成的专注记录',
    icon: 'Clock',
    category: 'productivity',
    size: { columns: 2, rows: 1 },
    isDefault: true,
    isCustom: false
  },
  {
    id: 'memory-insights',
    title: '记忆洞察',
    description: '查看近期上下文和成长记忆',
    icon: 'Brain',
    category: 'productivity',
    size: { columns: 2, rows: 1 },
    isDefault: true,
    isCustom: false
  },
  {
    id: 'ai-coach',
    title: 'AI 备考教练',
    description: '根据当前场景生成下一步行动建议',
    icon: 'Bot',
    category: 'learning',
    size: { columns: 2, rows: 1 },
    isDefault: true,
    isCustom: false
  },
  {
    id: 'platform-matrix',
    title: '多端预留',
    description: '展示桌面、小程序和未来多端规划',
    icon: 'MonitorSmartphone',
    category: 'productivity',
    size: { columns: 2, rows: 1 },
    isDefault: true,
    isCustom: false
  },
  {
    id: 'mini-program-preview',
    title: '小程序试验版',
    description: '预览小程序轻量执行端结构',
    icon: 'MonitorSmartphone',
    category: 'productivity',
    size: { columns: 2, rows: 2 },
    isDefault: true,
    isCustom: false
  },
  {
    id: 'theme-center',
    title: '主题中心',
    description: '管理主题库、场景推荐和视觉风格',
    icon: 'Sparkles',
    category: 'life',
    size: { columns: 2, rows: 2 },
    isDefault: true,
    isCustom: false
  },
  {
    id: 'cycle-today',
    title: '今日周期',
    description: '展示当前周期阶段和能量建议',
    icon: 'Heart',
    category: 'health',
    size: { columns: 1, rows: 1 },
    isDefault: true,
    isCustom: false
  },
  {
    id: 'memory-profile',
    title: '记忆画像',
    description: '查看和管理个人记忆画像',
    icon: 'Brain',
    category: 'ai',
    size: { columns: 2, rows: 2 },
    isDefault: true,
    isCustom: false
  },
  {
    id: 'badge-display',
    title: '成就徽章',
    description: '查看已解锁的成就徽章和进度',
    icon: 'Award',
    category: 'productivity',
    size: { columns: 2, rows: 1 },
    isDefault: true,
    isCustom: false
  },
  {
    id: 'habit-tracker',
    title: '习惯追踪',
    description: '每日习惯打卡和进度追踪',
    icon: 'CheckSquare',
    category: 'health',
    size: { columns: 2, rows: 1 },
    isDefault: true,
    isCustom: false
  },
  {
    id: 'journal',
    title: '复盘日记',
    description: '每日复盘、心情记录和反思',
    icon: 'BookOpen',
    category: 'productivity',
    size: { columns: 2, rows: 2 },
    isDefault: true,
    isCustom: false
  },
  {
    id: 'goal-tracker',
    title: '目标管理',
    description: '设定目标、关键结果和进度追踪',
    icon: 'Target',
    category: 'productivity',
    size: { columns: 2, rows: 2 },
    isDefault: true,
    isCustom: false
  },
  {
    id: 'study-dashboard',
    title: '学习仪表盘',
    description: '管理学习目标、任务、笔记和复习计划',
    icon: 'GraduationCap',
    category: 'learning',
    size: { columns: 2, rows: 2 },
    isDefault: true,
    isCustom: false
  },
  {
    id: 'creator-workbench',
    title: '内容创作工作台',
    description: '灵感收集、内容生产、发布日历和客户交付管理',
    icon: 'PenTool',
    category: 'productivity',
    size: { columns: 2, rows: 2 },
    isDefault: true,
    isCustom: false
  },
  {
    id: 'finance-tracker',
    title: '财务管理',
    description: '收入支出追踪、预算管理、财务目标进度',
    icon: 'Wallet',
    category: 'productivity',
    size: { columns: 2, rows: 2 },
    isDefault: true,
    isCustom: false
  },
  {
    id: 'reading-list',
    title: '阅读清单',
    description: '书籍管理、阅读进度追踪、读书笔记',
    icon: 'BookOpen',
    category: 'learning',
    size: { columns: 2, rows: 2 },
    isDefault: true,
    isCustom: false
  },
  {
    id: 'project-manager',
    title: '项目管理',
    description: '项目看板、里程碑、任务分解和进度追踪',
    icon: 'FolderKanban',
    category: 'productivity',
    size: { columns: 2, rows: 2 },
    isDefault: true,
    isCustom: false
  },
  {
    id: 'wellness-life',
    title: '健康生活',
    description: '饮食记录、饮水追踪、运动管理和健康目标',
    icon: 'Heart',
    category: 'health',
    size: { columns: 2, rows: 2 },
    isDefault: true,
    isCustom: false
  },
  {
    id: 'quick-notes',
    title: '速记',
    description: '快速捕捉想法、置顶重要笔记、全文搜索',
    icon: 'StickyNote',
    category: 'productivity',
    size: { columns: 2, rows: 1 },
    isDefault: true,
    isCustom: false
  },
  {
    id: 'report-center',
    title: '报告中心',
    description: '周报/月报生成，数据可视化汇总',
    icon: 'FileText',
    category: 'productivity',
    size: { columns: 2, rows: 2 },
    isDefault: true,
    isCustom: false
  },
  {
    id: 'global-search',
    title: '全局搜索',
    description: '搜索所有任务、笔记、目标等内容',
    icon: 'Search',
    category: 'productivity',
    size: { columns: 2, rows: 1 },
    isDefault: true,
    isCustom: false
  },
  {
    id: 'mood-tracker',
    title: '心情追踪',
    description: '记录每日心情，查看趋势和统计',
    icon: 'Smile',
    category: 'health',
    size: { columns: 2, rows: 1 },
    isDefault: true,
    isCustom: false
  },
  {
    id: 'time-block',
    title: '时间块',
    description: '一天时间块规划和管理',
    icon: 'Clock',
    category: 'productivity',
    size: { columns: 2, rows: 1 },
    isDefault: true,
    isCustom: false
  },
  {
    id: 'focus-stats',
    title: '专注统计',
    description: '专注时长趋势、任务分布、效率分析',
    icon: 'BarChart',
    category: 'productivity',
    size: { columns: 2, rows: 1 },
    isDefault: true,
    isCustom: false
  }
]

export const getModuleById = (id: string): Module | undefined =>
  defaultModules.find(m => m.id === id)

export const getModulesByCategory = (category: string): Module[] =>
  defaultModules.filter(m => m.category === category)
