export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  category: 'streak' | 'milestone' | 'skill' | 'social' | 'special'
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  unlockedAt?: string
  progress: number
  target: number
  isUnlocked: boolean
}

export interface BadgeCollection {
  badges: Badge[]
  totalUnlocked: number
  totalCount: number
  recentlyUnlocked: Badge[]
}

export const BADGE_DEFINITIONS: Omit<Badge, 'unlockedAt' | 'progress' | 'isUnlocked'>[] = [
  {
    id: 'first-focus',
    name: '初次专注',
    description: '完成第一次专注会话',
    icon: '🎯',
    category: 'milestone',
    tier: 'bronze',
    target: 1
  },
  {
    id: 'focus-10',
    name: '专注新手',
    description: '累计完成 10 次专注',
    icon: '⏱️',
    category: 'milestone',
    tier: 'bronze',
    target: 10
  },
  {
    id: 'focus-50',
    name: '专注达人',
    description: '累计完成 50 次专注',
    icon: '⚡',
    category: 'milestone',
    tier: 'silver',
    target: 50
  },
  {
    id: 'focus-100',
    name: '专注大师',
    description: '累计完成 100 次专注',
    icon: '🔥',
    category: 'milestone',
    tier: 'gold',
    target: 100
  },
  {
    id: 'streak-3',
    name: '三日坚持',
    description: '连续 3 天完成专注',
    icon: '🌱',
    category: 'streak',
    tier: 'bronze',
    target: 3
  },
  {
    id: 'streak-7',
    name: '一周达人',
    description: '连续 7 天完成专注',
    icon: '🌿',
    category: 'streak',
    tier: 'silver',
    target: 7
  },
  {
    id: 'streak-30',
    name: '月度冠军',
    description: '连续 30 天完成专注',
    icon: '🌳',
    category: 'streak',
    tier: 'gold',
    target: 30
  },
  {
    id: 'streak-100',
    name: '百天传奇',
    description: '连续 100 天完成专注',
    icon: '🏆',
    category: 'streak',
    tier: 'platinum',
    target: 100
  },
  {
    id: 'task-10',
    name: '任务新手',
    description: '完成 10 个任务',
    icon: '✅',
    category: 'milestone',
    tier: 'bronze',
    target: 10
  },
  {
    id: 'task-50',
    name: '任务达人',
    description: '完成 50 个任务',
    icon: '📋',
    category: 'milestone',
    tier: 'silver',
    target: 50
  },
  {
    id: 'task-100',
    name: '任务收割机',
    description: '完成 100 个任务',
    icon: '🚀',
    category: 'milestone',
    tier: 'gold',
    target: 100
  },
  {
    id: 'early-bird',
    name: '晨间战士',
    description: '在早上 8 点前完成专注',
    icon: '🌅',
    category: 'skill',
    tier: 'silver',
    target: 5
  },
  {
    id: 'night-owl',
    name: '夜猫子',
    description: '在晚上 10 点后完成专注',
    icon: '🌙',
    category: 'skill',
    tier: 'silver',
    target: 5
  },
  {
    id: 'multi-persona',
    name: '多重身份',
    description: '使用过 3 种不同身份',
    icon: '🎭',
    category: 'skill',
    tier: 'gold',
    target: 3
  },
  {
    id: 'theme-collector',
    name: '主题收藏家',
    description: '切换过 5 种不同主题',
    icon: '🎨',
    category: 'skill',
    tier: 'silver',
    target: 5
  },
  {
    id: 'memory-keeper',
    name: '记忆守护者',
    description: '完善记忆画像',
    icon: '🧠',
    category: 'special',
    tier: 'gold',
    target: 1
  },
  {
    id: 'avatar-creator',
    name: '角色创造者',
    description: '创建你的第一个 3D 角色',
    icon: '👤',
    category: 'special',
    tier: 'silver',
    target: 1
  },
  {
    id: 'cycle-master',
    name: '周期大师',
    description: '记录 30 天周期数据',
    icon: '📊',
    category: 'special',
    tier: 'gold',
    target: 30
  }
]

export const TIER_COLORS: Record<Badge['tier'], string> = {
  bronze: '#cd7f32',
  silver: '#c0c0c0',
  gold: '#ffd700',
  platinum: '#e5e4e2'
}

export const TIER_LABELS: Record<Badge['tier'], string> = {
  bronze: '青铜',
  silver: '白银',
  gold: '黄金',
  platinum: '铂金'
}
