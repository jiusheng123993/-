export interface Transaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  category: string
  description: string
  date: string
  tags: string[]
}

export interface Budget {
  id: string
  category: string
  limit: number
  period: 'monthly' | 'weekly' | 'yearly'
}

export interface FinanceGoal {
  id: string
  title: string
  targetAmount: number
  currentAmount: number
  deadline: string
  category: 'saving' | 'investment' | 'debt-repayment' | 'purchase'
}

export interface FinanceState {
  transactions: Transaction[]
  budgets: Budget[]
  goals: FinanceGoal[]
}

const STORAGE_KEY = 'xinghuanhai-finance-state'

const INCOME_CATEGORIES = ['工资', '兼职', '投资', '红包', '退款', '其他收入']
const EXPENSE_CATEGORIES = ['餐饮', '交通', '购物', '住房', '娱乐', '教育', '医疗', '通讯', '日用', '其他支出']

export const financeCategories = {
  income: INCOME_CATEGORIES,
  expense: EXPENSE_CATEGORIES
}

function loadState(): FinanceState {
  if (typeof window === 'undefined') return { transactions: [], budgets: [], goals: [] }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { transactions: [], budgets: [], goals: [] }
}

function saveState(state: FinanceState): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export interface FinanceService {
  getState(): FinanceState
  addTransaction(type: 'income' | 'expense', amount: number, category: string, description: string, tags?: string[]): Transaction
  removeTransaction(id: string): void
  updateTransaction(id: string, updates: Partial<Pick<Transaction, 'amount' | 'category' | 'description' | 'tags'>>): void
  addBudget(category: string, limit: number, period?: Budget['period']): Budget
  removeBudget(id: string): void
  updateBudget(id: string, limit: number): void
  addGoal(title: string, targetAmount: number, deadline: string, category?: FinanceGoal['category']): FinanceGoal
  updateGoalProgress(id: string, currentAmount: number): void
  removeGoal(id: string): void
  getMonthlySummary(year: number, month: number): { totalIncome: number; totalExpense: number; balance: number; byCategory: Record<string, number> }
  getBudgetStatus(): { category: string; limit: number; spent: number; remaining: number; percent: number }[]
  getGoalProgress(): { goal: FinanceGoal; percent: number }[]
}

export function createFinanceService(): FinanceService {
  const getState = (): FinanceState => loadState()

  const save = (state: FinanceState): void => saveState(state)

  const addTransaction = (type: 'income' | 'expense', amount: number, category: string, description: string, tags: string[] = []): Transaction => {
    const state = getState()
    const tx: Transaction = {
      id: crypto.randomUUID(),
      type,
      amount,
      category,
      description,
      date: new Date().toISOString(),
      tags
    }
    save({ ...state, transactions: [...state.transactions, tx] })
    return tx
  }

  const removeTransaction = (id: string): void => {
    const state = getState()
    save({ ...state, transactions: state.transactions.filter((t) => t.id !== id) })
  }

  const updateTransaction = (id: string, updates: Partial<Pick<Transaction, 'amount' | 'category' | 'description' | 'tags'>>): void => {
    const state = getState()
    save({
      ...state,
      transactions: state.transactions.map((t) => (t.id === id ? { ...t, ...updates } : t))
    })
  }

  const addBudget = (category: string, limit: number, period: Budget['period'] = 'monthly'): Budget => {
    const state = getState()
    const budget: Budget = { id: crypto.randomUUID(), category, limit, period }
    save({ ...state, budgets: [...state.budgets, budget] })
    return budget
  }

  const removeBudget = (id: string): void => {
    const state = getState()
    save({ ...state, budgets: state.budgets.filter((b) => b.id !== id) })
  }

  const updateBudget = (id: string, limit: number): void => {
    const state = getState()
    save({
      ...state,
      budgets: state.budgets.map((b) => (b.id === id ? { ...b, limit } : b))
    })
  }

  const addGoal = (title: string, targetAmount: number, deadline: string, category: FinanceGoal['category'] = 'saving'): FinanceGoal => {
    const state = getState()
    const goal: FinanceGoal = { id: crypto.randomUUID(), title, targetAmount, currentAmount: 0, deadline, category }
    save({ ...state, goals: [...state.goals, goal] })
    return goal
  }

  const updateGoalProgress = (id: string, currentAmount: number): void => {
    const state = getState()
    save({
      ...state,
      goals: state.goals.map((g) => (g.id === id ? { ...g, currentAmount: Math.max(0, currentAmount) } : g))
    })
  }

  const removeGoal = (id: string): void => {
    const state = getState()
    save({ ...state, goals: state.goals.filter((g) => g.id !== id) })
  }

  const getMonthlySummary = (year: number, month: number) => {
    const state = getState()
    const monthTxs = state.transactions.filter((t) => {
      const d = new Date(t.date)
      return d.getFullYear() === year && d.getMonth() + 1 === month
    })

    let totalIncome = 0
    let totalExpense = 0
    const byCategory: Record<string, number> = {}

    for (const tx of monthTxs) {
      if (tx.type === 'income') {
        totalIncome += tx.amount
      } else {
        totalExpense += tx.amount
        byCategory[tx.category] = (byCategory[tx.category] || 0) + tx.amount
      }
    }

    return { totalIncome, totalExpense, balance: totalIncome - totalExpense, byCategory }
  }

  const getBudgetStatus = () => {
    const state = getState()
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1

    return state.budgets.map((budget) => {
      const spent = state.transactions
        .filter((t) => {
          const d = new Date(t.date)
          return t.type === 'expense' && t.category === budget.category && d.getFullYear() === year && d.getMonth() + 1 === month
        })
        .reduce((sum, t) => sum + t.amount, 0)

      return {
        category: budget.category,
        limit: budget.limit,
        spent,
        remaining: budget.limit - spent,
        percent: budget.limit > 0 ? Math.min(100, Math.round((spent / budget.limit) * 100)) : 0
      }
    })
  }

  const getGoalProgress = () => {
    const state = getState()
    return state.goals.map((goal) => ({
      goal,
      percent: goal.targetAmount > 0 ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)) : 0
    }))
  }

  return {
    getState,
    addTransaction,
    removeTransaction,
    updateTransaction,
    addBudget,
    removeBudget,
    updateBudget,
    addGoal,
    updateGoalProgress,
    removeGoal,
    getMonthlySummary,
    getBudgetStatus,
    getGoalProgress
  }
}