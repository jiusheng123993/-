export interface Meal {
  id: string
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  date: string
}

export interface WaterLog {
  id: string
  amount: number
  unit: 'ml'
  timestamp: string
}

export interface Exercise {
  id: string
  type: string
  duration: number
  calories: number
  date: string
}

export interface WellnessGoal {
  id: string
  type: 'water' | 'exercise' | 'sleep'
  target: number
  unit: string
}

export interface WellnessState {
  meals: Meal[]
  water: WaterLog[]
  exercises: Exercise[]
  goals: WellnessGoal[]
}

const STORAGE_KEY = 'xinghuanhai-wellness-state'

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const
const EXERCISE_TYPES = ['跑步', '游泳', '瑜伽', '健身', '骑行', '散步', '其他']

export const mealTypes = MEAL_TYPES
export const exerciseTypes = EXERCISE_TYPES

function loadState(): WellnessState {
  if (typeof window === 'undefined') return { meals: [], water: [], exercises: [], goals: [] }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { meals: [], water: [], exercises: [], goals: [] }
}

function saveState(state: WellnessState): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export interface WellnessService {
  getState(): WellnessState
  addMeal(type: Meal['type'], name: string, calories: number, protein?: number, carbs?: number, fat?: number): Meal
  removeMeal(id: string): void
  addWater(amount: number): WaterLog
  removeWater(id: string): void
  addExercise(type: string, duration: number, calories: number): Exercise
  removeExercise(id: string): void
  setGoal(type: WellnessGoal['type'], target: number, unit: string): void
  removeGoal(id: string): void
  getDailyNutrition(date: string): { calories: number; protein: number; carbs: number; fat: number }
  getDailyWater(date: string): number
  getDailyExercise(date: string): { totalDuration: number; totalCalories: number }
  getGoalProgress(type: WellnessGoal['type'], date: string): { target: number; current: number; percent: number }
}

export function createWellnessService(): WellnessService {
  const getState = (): WellnessState => loadState()

  const save = (state: WellnessState): void => saveState(state)

  const addMeal = (type: Meal['type'], name: string, calories: number, protein: number = 0, carbs: number = 0, fat: number = 0): Meal => {
    const state = getState()
    const meal: Meal = {
      id: crypto.randomUUID(),
      type,
      name,
      calories,
      protein,
      carbs,
      fat,
      date: new Date().toISOString().split('T')[0]
    }
    save({ ...state, meals: [...state.meals, meal] })
    return meal
  }

  const removeMeal = (id: string): void => {
    const state = getState()
    save({ ...state, meals: state.meals.filter((m) => m.id !== id) })
  }

  const addWater = (amount: number): WaterLog => {
    const state = getState()
    const log: WaterLog = {
      id: crypto.randomUUID(),
      amount,
      unit: 'ml',
      timestamp: new Date().toISOString()
    }
    save({ ...state, water: [...state.water, log] })
    return log
  }

  const removeWater = (id: string): void => {
    const state = getState()
    save({ ...state, water: state.water.filter((w) => w.id !== id) })
  }

  const addExercise = (type: string, duration: number, calories: number): Exercise => {
    const state = getState()
    const exercise: Exercise = {
      id: crypto.randomUUID(),
      type,
      duration,
      calories,
      date: new Date().toISOString().split('T')[0]
    }
    save({ ...state, exercises: [...state.exercises, exercise] })
    return exercise
  }

  const removeExercise = (id: string): void => {
    const state = getState()
    save({ ...state, exercises: state.exercises.filter((e) => e.id !== id) })
  }

  const setGoal = (type: WellnessGoal['type'], target: number, unit: string): void => {
    const state = getState()
    const existing = state.goals.find((g) => g.type === type)
    if (existing) {
      save({
        ...state,
        goals: state.goals.map((g) => (g.type === type ? { ...g, target, unit } : g))
      })
    } else {
      save({
        ...state,
        goals: [...state.goals, { id: crypto.randomUUID(), type, target, unit }]
      })
    }
  }

  const removeGoal = (id: string): void => {
    const state = getState()
    save({ ...state, goals: state.goals.filter((g) => g.id !== id) })
  }

  const getDailyNutrition = (date: string) => {
    const state = getState()
    const dayMeals = state.meals.filter((m) => m.date === date)
    return dayMeals.reduce(
      (acc, m) => ({
        calories: acc.calories + m.calories,
        protein: acc.protein + m.protein,
        carbs: acc.carbs + m.carbs,
        fat: acc.fat + m.fat
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    )
  }

  const getDailyWater = (date: string) => {
    const state = getState()
    return state.water
      .filter((w) => w.timestamp.split('T')[0] === date)
      .reduce((sum, w) => sum + w.amount, 0)
  }

  const getDailyExercise = (date: string) => {
    const state = getState()
    const dayExercises = state.exercises.filter((e) => e.date === date)
    return {
      totalDuration: dayExercises.reduce((sum, e) => sum + e.duration, 0),
      totalCalories: dayExercises.reduce((sum, e) => sum + e.calories, 0)
    }
  }

  const getGoalProgress = (type: WellnessGoal['type'], date: string) => {
    const state = getState()
    const goal = state.goals.find((g) => g.type === type)
    if (!goal) return { target: 0, current: 0, percent: 0 }

    let current = 0
    if (type === 'water') {
      current = getDailyWater(date)
    } else if (type === 'exercise') {
      current = getDailyExercise(date).totalDuration
    }

    return {
      target: goal.target,
      current,
      percent: goal.target > 0 ? Math.min(100, Math.round((current / goal.target) * 100)) : 0
    }
  }

  return {
    getState,
    addMeal,
    removeMeal,
    addWater,
    removeWater,
    addExercise,
    removeExercise,
    setGoal,
    removeGoal,
    getDailyNutrition,
    getDailyWater,
    getDailyExercise,
    getGoalProgress
  }
}