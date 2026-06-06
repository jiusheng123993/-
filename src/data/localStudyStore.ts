import type { ThemeId } from '../themes/themeRegistry'

export type StudyGoal = {
  id: string
  title: string
  subject: string
  targetDate: string
  progress: number
}

export type StudyTask = {
  id: string
  title: string
  goalId: string
  status: 'todo' | 'done'
  minutes: number
  rewardPoints: number
}

export type StudyNote = {
  id: string
  title: string
  subject: string
  updatedAt: string
}

export type ReviewItem = {
  id: string
  title: string
  subject: string
  dueDate: string
  level: 'easy' | 'medium' | 'hard'
}

export type GrowthState = {
  level: number
  experience: number
  streakDays: number
  achievements: number
}

export type StudyState = {
  goals: StudyGoal[]
  tasks: StudyTask[]
  notes: StudyNote[]
  reviews: ReviewItem[]
  growth: GrowthState
  preferences: {
    themeId: ThemeId
  }
}

export type StudyStore = {
  load: () => StudyState
  save: (state: StudyState) => void
}

export const createInitialStudyState = (): StudyState => ({
  goals: [
    {
      id: 'goal-math',
      title: '高数期末冲刺',
      subject: '高数',
      targetDate: '2026-06-20',
      progress: 72
    },
    {
      id: 'goal-english',
      title: '英语四级词汇计划',
      subject: '英语',
      targetDate: '2026-07-01',
      progress: 48
    }
  ],
  tasks: [
    {
      id: 'task-1',
      title: '完成高数极限专题 20 题',
      goalId: 'goal-math',
      status: 'todo',
      minutes: 60,
      rewardPoints: 60
    },
    {
      id: 'task-2',
      title: '背诵四级核心词 80 个',
      goalId: 'goal-english',
      status: 'todo',
      minutes: 35,
      rewardPoints: 45
    },
    {
      id: 'task-3',
      title: '整理今天的错题复盘',
      goalId: 'goal-math',
      status: 'done',
      minutes: 25,
      rewardPoints: 35
    }
  ],
  notes: [
    {
      id: 'note-1',
      title: '导数应用易错点',
      subject: '高数',
      updatedAt: '今天 18:20'
    },
    {
      id: 'note-2',
      title: '作文万能句复盘',
      subject: '英语',
      updatedAt: '昨天 21:10'
    }
  ],
  reviews: [
    {
      id: 'review-1',
      title: '洛必达法则适用条件',
      subject: '高数',
      dueDate: '今天',
      level: 'hard'
    },
    {
      id: 'review-2',
      title: '近义词辨析 abandon / desert',
      subject: '英语',
      dueDate: '明天',
      level: 'medium'
    }
  ],
  growth: {
    level: 18,
    experience: 1260,
    streakDays: 12,
    achievements: 23
  },
  preferences: {
    themeId: 'minimal-premium'
  }
})

export const createMemoryStudyStore = (initialState = createInitialStudyState()): StudyStore => {
  let state = structuredClone(initialState)

  return {
    load: () => structuredClone(state),
    save: (nextState) => {
      state = structuredClone(nextState)
    }
  }
}

export const createBrowserStudyStore = (storageKey = 'studyflow-state'): StudyStore => ({
  load: () => {
    const stored = window.localStorage.getItem(storageKey)
    if (!stored) {
      return createInitialStudyState()
    }

    try {
      return JSON.parse(stored) as StudyState
    } catch {
      return createInitialStudyState()
    }
  },
  save: (state) => {
    window.localStorage.setItem(storageKey, JSON.stringify(state))
  }
})
