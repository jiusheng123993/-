import { describe, it, expect, beforeEach } from 'vitest'
import { createFinanceService, financeCategories } from './financeService'
import type { FinanceService } from './financeService'

describe('financeService', () => {
  let service: FinanceService

  beforeEach(() => {
    localStorage.clear()
    service = createFinanceService()
  })

  describe('categories', () => {
    it('has income categories', () => {
      expect(financeCategories.income.length).toBeGreaterThan(0)
      expect(financeCategories.income).toContain('工资')
    })

    it('has expense categories', () => {
      expect(financeCategories.expense.length).toBeGreaterThan(0)
      expect(financeCategories.expense).toContain('餐饮')
    })
  })

  describe('transactions', () => {
    it('adds an income transaction', () => {
      const tx = service.addTransaction('income', 5000, '工资', '月薪')
      expect(tx.type).toBe('income')
      expect(tx.amount).toBe(5000)
      expect(tx.category).toBe('工资')
      expect(tx.id).toBeTruthy()
    })

    it('adds an expense transaction', () => {
      const tx = service.addTransaction('expense', 35, '餐饮', '午餐')
      expect(tx.type).toBe('expense')
      expect(tx.amount).toBe(35)
    })

    it('adds transaction with tags', () => {
      const tx = service.addTransaction('expense', 100, '购物', '衣服', ['必需品'])
      expect(tx.tags).toEqual(['必需品'])
    })

    it('removes a transaction', () => {
      const tx = service.addTransaction('expense', 50, '交通', '地铁')
      service.removeTransaction(tx.id)
      const state = service.getState()
      expect(state.transactions).toHaveLength(0)
    })

    it('updates a transaction', () => {
      const tx = service.addTransaction('expense', 50, '交通', '地铁')
      service.updateTransaction(tx.id, { amount: 60, description: '打车' })
      const state = service.getState()
      expect(state.transactions[0].amount).toBe(60)
      expect(state.transactions[0].description).toBe('打车')
    })

    it('persists transactions across service instances', () => {
      service.addTransaction('income', 3000, '兼职', ' freelance')
      const service2 = createFinanceService()
      expect(service2.getState().transactions).toHaveLength(1)
    })
  })

  describe('budgets', () => {
    it('adds a budget', () => {
      const budget = service.addBudget('餐饮', 2000)
      expect(budget.category).toBe('餐饮')
      expect(budget.limit).toBe(2000)
      expect(budget.period).toBe('monthly')
    })

    it('adds a budget with custom period', () => {
      const budget = service.addBudget('娱乐', 500, 'weekly')
      expect(budget.period).toBe('weekly')
    })

    it('removes a budget', () => {
      const budget = service.addBudget('交通', 500)
      service.removeBudget(budget.id)
      expect(service.getState().budgets).toHaveLength(0)
    })

    it('updates a budget limit', () => {
      const budget = service.addBudget('购物', 1000)
      service.updateBudget(budget.id, 1500)
      expect(service.getState().budgets[0].limit).toBe(1500)
    })
  })

  describe('goals', () => {
    it('adds a saving goal', () => {
      const goal = service.addGoal('买车', 100000, '2026-12-31')
      expect(goal.title).toBe('买车')
      expect(goal.targetAmount).toBe(100000)
      expect(goal.currentAmount).toBe(0)
      expect(goal.category).toBe('saving')
    })

    it('adds a goal with custom category', () => {
      const goal = service.addGoal('还信用卡', 5000, '2026-07-01', 'debt-repayment')
      expect(goal.category).toBe('debt-repayment')
    })

    it('updates goal progress', () => {
      const goal = service.addGoal('旅行基金', 20000, '2026-10-01')
      service.updateGoalProgress(goal.id, 5000)
      expect(service.getState().goals[0].currentAmount).toBe(5000)
    })

    it('does not allow negative progress', () => {
      const goal = service.addGoal('旅行基金', 20000, '2026-10-01')
      service.updateGoalProgress(goal.id, 5000)
      service.updateGoalProgress(goal.id, -100)
      expect(service.getState().goals[0].currentAmount).toBe(0)
    })

    it('removes a goal', () => {
      const goal = service.addGoal('买车', 100000, '2026-12-31')
      service.removeGoal(goal.id)
      expect(service.getState().goals).toHaveLength(0)
    })
  })

  describe('monthly summary', () => {
    it('calculates monthly income and expense', () => {
      const now = new Date()
      service.addTransaction('income', 10000, '工资', '月薪')
      service.addTransaction('expense', 2000, '餐饮', '吃饭')
      service.addTransaction('expense', 1500, '住房', '房租')

      const summary = service.getMonthlySummary(now.getFullYear(), now.getMonth() + 1)
      expect(summary.totalIncome).toBe(10000)
      expect(summary.totalExpense).toBe(3500)
      expect(summary.balance).toBe(6500)
    })

    it('groups expenses by category', () => {
      const now = new Date()
      service.addTransaction('expense', 100, '餐饮', '早餐')
      service.addTransaction('expense', 200, '餐饮', '午餐')
      service.addTransaction('expense', 50, '交通', '公交')

      const summary = service.getMonthlySummary(now.getFullYear(), now.getMonth() + 1)
      expect(summary.byCategory['餐饮']).toBe(300)
      expect(summary.byCategory['交通']).toBe(50)
    })

    it('returns zero for empty month', () => {
      const summary = service.getMonthlySummary(2020, 1)
      expect(summary.totalIncome).toBe(0)
      expect(summary.totalExpense).toBe(0)
      expect(summary.balance).toBe(0)
    })
  })

  describe('budget status', () => {
    it('calculates budget spending', () => {
      service.addBudget('餐饮', 3000)
      service.addTransaction('expense', 500, '餐饮', '午餐')
      service.addTransaction('expense', 300, '餐饮', '晚餐')

      const status = service.getBudgetStatus()
      expect(status).toHaveLength(1)
      expect(status[0].spent).toBe(800)
      expect(status[0].remaining).toBe(2200)
      expect(status[0].percent).toBe(27)
    })

    it('caps percent at 100', () => {
      service.addBudget('购物', 100)
      service.addTransaction('expense', 200, '购物', '超支')

      const status = service.getBudgetStatus()
      expect(status[0].percent).toBe(100)
    })

    it('returns empty array when no budgets', () => {
      expect(service.getBudgetStatus()).toEqual([])
    })
  })

  describe('goal progress', () => {
    it('calculates goal progress percent', () => {
      service.addGoal('买车', 100000, '2026-12-31')
      service.updateGoalProgress(service.getState().goals[0].id, 25000)

      const progress = service.getGoalProgress()
      expect(progress).toHaveLength(1)
      expect(progress[0].percent).toBe(25)
    })

    it('returns 0 percent for zero target', () => {
      service.addGoal('测试', 0, '2026-12-31')
      const progress = service.getGoalProgress()
      expect(progress[0].percent).toBe(0)
    })
  })
})