export interface GoalItem {
  id: string
  title: string
  description: string
  progress: number
  status: 'active' | 'completed' | 'archived'
  createdAt: string
  updatedAt: string
}

export interface GoalState {
  goals: GoalItem[]
}

const STORAGE_KEY = 'xinghuanhai-goal-state'

export function createInitialGoalState(): GoalState {
  return {
    goals: [
      {
        id: 'goal-demo-1',
        title: '完成 React 全栈项目',
        description: '使用 React + TypeScript + Supabase 构建个人成长工作台',
        progress: 65,
        status: 'active',
        createdAt: '2026-05-20',
        updatedAt: '2026-06-12'
      },
      {
        id: 'goal-demo-2',
        title: '每日阅读 30 分钟',
        description: '养成持续阅读习惯，本月目标读完 2 本书',
        progress: 80,
        status: 'active',
        createdAt: '2026-06-01',
        updatedAt: '2026-06-13'
      },
      {
        id: 'goal-demo-3',
        title: '通过英语六级考试',
        description: '重点突破听力和阅读，每周做 2 套真题',
        progress: 40,
        status: 'active',
        createdAt: '2026-05-15',
        updatedAt: '2026-06-10'
      },
      {
        id: 'goal-demo-4',
        title: '减重 5kg 计划',
        description: '控制饮食 + 每周运动 4 次，目标体重 65kg',
        progress: 30,
        status: 'active',
        createdAt: '2026-06-05',
        updatedAt: '2026-06-12'
      },
      {
        id: 'goal-demo-5',
        title: '学会弹唱 3 首吉他曲',
        description: '已完成《小星星》，正在练习《晴天》',
        progress: 55,
        status: 'completed',
        createdAt: '2026-04-01',
        updatedAt: '2026-05-30'
      }
    ]
  }
}

export interface GoalStore {
  load: () => GoalState
  save: (state: GoalState) => void
}

export function createGoalBrowserStore(storageKey = STORAGE_KEY): GoalStore {
  return {
    load: () => {
      if (typeof window === 'undefined') return createInitialGoalState()
      try {
        const raw = window.localStorage.getItem(storageKey)
        if (raw) return JSON.parse(raw)
      } catch { /* ignore */ }
      return createInitialGoalState()
    },
    save: (state) => {
      if (typeof window === 'undefined') return
      window.localStorage.setItem(storageKey, JSON.stringify(state))
    }
  }
}
