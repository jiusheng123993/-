import { createStorageService } from './storageFactory'

export interface FinanceTransaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  category: string
  description: string
  note: string
  date: string
}

export interface FinanceState {
  transactions: FinanceTransaction[]
}

const STORAGE_KEY = 'xinghuanhai-finance-state'

export function createInitialFinanceState(): FinanceState {
  return {
    transactions: [
      {
        id: 'fin-demo-1',
        type: 'income',
        amount: 5000,
        category: '工资',
        description: '6 月实习工资',
        note: '',
        date: '2026-06-10'
      },
      {
        id: 'fin-demo-2',
        type: 'expense',
        amount: 1200,
        category: '餐饮',
        description: '本月伙食费',
        note: '食堂 + 外卖',
        date: '2026-06-12'
      },
      {
        id: 'fin-demo-3',
        type: 'expense',
        amount: 350,
        category: '购物',
        description: '购买技术书籍',
        note: '《重构》《代码整洁之道》',
        date: '2026-06-08'
      },
      {
        id: 'fin-demo-4',
        type: 'expense',
        amount: 200,
        category: '交通',
        description: '地铁月卡充值',
        note: '',
        date: '2026-06-01'
      },
      {
        id: 'fin-demo-5',
        type: 'income',
        amount: 800,
        category: '兼职',
        description: '周末家教收入',
        note: '高中数学辅导',
        date: '2026-06-05'
      },
      {
        id: 'fin-demo-6',
        type: 'expense',
        amount: 150,
        category: '娱乐',
        description: '电影票',
        note: '《流浪地球3》',
        date: '2026-06-13'
      },
      {
        id: 'fin-demo-7',
        type: 'expense',
        amount: 500,
        category: '学习',
        description: '在线课程订阅',
        note: 'Udemy React 高级课程',
        date: '2026-06-03'
      }
    ]
  }
}

export interface FinanceStore {
  load: () => FinanceState
  save: (state: FinanceState) => void
}

export function createFinanceBrowserStore(storageKey = STORAGE_KEY): FinanceStore {
  const storage = createStorageService<FinanceState>(storageKey, createInitialFinanceState())
  return { load: storage.load, save: storage.save }
}
