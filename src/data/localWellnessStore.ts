export interface WellnessWater {
  id: string
  amount: number
  date: string
}

export interface WellnessExercise {
  id: string
  name: string
  duration: number
  date: string
}

export interface WellnessMeal {
  id: string
  name: string
  calories: number
  date: string
}

export interface WellnessState {
  water: WellnessWater[]
  exercises: WellnessExercise[]
  meals: WellnessMeal[]
}

const STORAGE_KEY = 'xinghuanhai-wellness-state'

export function createInitialWellnessState(): WellnessState {
  return {
    water: [
      { id: 'water-demo-1', amount: 250, date: '2026-06-13' },
      { id: 'water-demo-2', amount: 300, date: '2026-06-13' },
      { id: 'water-demo-3', amount: 250, date: '2026-06-13' },
      { id: 'water-demo-4', amount: 300, date: '2026-06-13' },
      { id: 'water-demo-5', amount: 250, date: '2026-06-13' },
      { id: 'water-demo-6', amount: 300, date: '2026-06-13' },
      { id: 'water-demo-7', amount: 250, date: '2026-06-12' },
      { id: 'water-demo-8', amount: 300, date: '2026-06-12' },
      { id: 'water-demo-9', amount: 250, date: '2026-06-12' },
      { id: 'water-demo-10', amount: 300, date: '2026-06-12' }
    ],
    exercises: [
      { id: 'ex-demo-1', name: '晨跑 5 公里', duration: 30, date: '2026-06-13' },
      { id: 'ex-demo-2', name: '俯卧撑 3 组', duration: 15, date: '2026-06-12' },
      { id: 'ex-demo-3', name: '瑜伽拉伸', duration: 20, date: '2026-06-11' },
      { id: 'ex-demo-4', name: '跳绳 1000 次', duration: 15, date: '2026-06-10' },
      { id: 'ex-demo-5', name: '篮球 1 小时', duration: 60, date: '2026-06-09' }
    ],
    meals: [
      { id: 'meal-demo-1', name: '鸡蛋 + 全麦面包 + 牛奶', calories: 450, date: '2026-06-13' },
      { id: 'meal-demo-2', name: '鸡胸肉沙拉 + 糙米饭', calories: 550, date: '2026-06-13' },
      { id: 'meal-demo-3', name: '清蒸鱼 + 西兰花', calories: 400, date: '2026-06-13' },
      { id: 'meal-demo-4', name: '燕麦粥 + 香蕉', calories: 350, date: '2026-06-12' },
      { id: 'meal-demo-5', name: '牛肉面', calories: 650, date: '2026-06-12' },
      { id: 'meal-demo-6', name: '蔬菜汤 + 全麦馒头', calories: 300, date: '2026-06-12' }
    ]
  }
}

export interface WellnessStore {
  load: () => WellnessState
  save: (state: WellnessState) => void
}

export function createWellnessBrowserStore(storageKey = STORAGE_KEY): WellnessStore {
  return {
    load: () => {
      if (typeof window === 'undefined') return createInitialWellnessState()
      try {
        const raw = window.localStorage.getItem(storageKey)
        if (raw) return JSON.parse(raw)
      } catch { /* ignore */ }
      return createInitialWellnessState()
    },
    save: (state) => {
      if (typeof window === 'undefined') return
      window.localStorage.setItem(storageKey, JSON.stringify(state))
    }
  }
}
