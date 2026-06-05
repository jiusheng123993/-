import { useState, useEffect, useCallback } from 'react'
import { Wallet, TrendingUp, TrendingDown, Target, Plus, Trash2, DollarSign, PieChart } from 'lucide-react'
import { createFinanceService, financeCategories } from './financeService'
import type { FinanceService, Transaction, Budget, FinanceGoal } from './financeService'

interface FinanceUIProps {
  compact?: boolean
  service?: FinanceService
}

const colors = {
  bg: '#0f0f1a',
  cardBg: '#1a1a2e',
  cardBorder: '#2a2a4a',
  text: '#e0e0e0',
  textSecondary: '#8888aa',
  accent: '#00d9a5',
  accentLight: '#33e3b8',
  income: '#4caf50',
  expense: '#f44336',
  warning: '#ff9800',
  progressBg: '#2a2a4a',
  inputBg: '#12121f',
  inputBorder: '#2a2a4a',
  hoverBg: '#222240',
}

export function FinanceUI({ compact = false, service: externalService }: FinanceUIProps) {
  const [service] = useState<FinanceService>(() => externalService ?? createFinanceService())
  const [activeTab, setActiveTab] = useState<'summary' | 'transactions' | 'budgets' | 'goals'>('summary')
  const [txType, setTxType] = useState<'income' | 'expense'>('expense')
  const [txAmount, setTxAmount] = useState('')
  const [txCategory, setTxCategory] = useState('')
  const [txDesc, setTxDesc] = useState('')
  const [budgetCategory, setBudgetCategory] = useState('')
  const [budgetLimit, setBudgetLimit] = useState('')
  const [goalTitle, setGoalTitle] = useState('')
  const [goalAmount, setGoalAmount] = useState('')
  const [goalDeadline, setGoalDeadline] = useState('')
  const [goalCategory, setGoalCategory] = useState<FinanceGoal['category']>('saving')
  const [goalDepositInputs, setGoalDepositInputs] = useState<Record<string, string>>({})

  const now = new Date()
  const summary = service.getMonthlySummary(now.getFullYear(), now.getMonth() + 1)
  const budgetStatus = service.getBudgetStatus()
  const goalProgress = service.getGoalProgress()
  const state = service.getState()

  const handleAddTransaction = useCallback(() => {
    if (!txAmount || !txCategory) return
    service.addTransaction(txType, parseFloat(txAmount), txCategory, txDesc)
    setTxAmount('')
    setTxCategory('')
    setTxDesc('')
  }, [service, txType, txAmount, txCategory, txDesc])

  const handleAddBudget = useCallback(() => {
    if (!budgetCategory || !budgetLimit) return
    service.addBudget(budgetCategory, parseFloat(budgetLimit))
    setBudgetCategory('')
    setBudgetLimit('')
  }, [service, budgetCategory, budgetLimit])

  const handleAddGoal = useCallback(() => {
    if (!goalTitle || !goalAmount || !goalDeadline) return
    service.addGoal(goalTitle, parseFloat(goalAmount), goalDeadline, goalCategory)
    setGoalTitle('')
    setGoalAmount('')
    setGoalDeadline('')
    setGoalCategory('saving')
  }, [service, goalTitle, goalAmount, goalDeadline, goalCategory])

  if (compact) {
    return (
      <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 16, width: 280, color: colors.text, fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Wallet size={18} style={{ color: colors.accent }} />
          <strong style={{ fontSize: 14 }}>本月收支</strong>
        </div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: colors.income, fontSize: 13, fontWeight: 600 }}>
              <TrendingUp size={14} />{summary.totalIncome.toLocaleString()}
            </div>
            <small style={{ color: colors.textSecondary, fontSize: 11 }}>收入</small>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: colors.expense, fontSize: 13, fontWeight: 600 }}>
              <TrendingDown size={14} />{summary.totalExpense.toLocaleString()}
            </div>
            <small style={{ color: colors.textSecondary, fontSize: 11 }}>支出</small>
          </div>
        </div>
        <div style={{ textAlign: 'center', padding: '8px 0', borderTop: `1px solid ${colors.cardBorder}` }}>
          <span style={{ color: summary.balance >= 0 ? colors.income : colors.expense, fontWeight: 600, fontSize: 15 }}>
            {summary.balance >= 0 ? '+' : ''}{summary.balance.toLocaleString()}
          </span>
          <small style={{ color: colors.textSecondary, marginLeft: 6 }}>结余</small>
        </div>
        {budgetStatus.length > 0 && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${colors.cardBorder}` }}>
            <small style={{ color: colors.textSecondary, fontSize: 11 }}>预算进度</small>
            {budgetStatus.slice(0, 2).map((b) => (
              <div key={b.category} style={{ marginTop: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                  <span>{b.category}</span>
                  <span style={{ color: b.percent > 80 ? colors.expense : colors.textSecondary }}>{b.percent}%</span>
                </div>
                <div style={{ height: 4, background: colors.progressBg, borderRadius: 2, marginTop: 2 }}>
                  <div style={{ height: '100%', width: `${Math.min(100, b.percent)}%`, background: b.percent > 80 ? colors.expense : colors.accent, borderRadius: 2 }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const tabs = [
    { id: 'summary', label: '概览', icon: PieChart },
    { id: 'transactions', label: '记账', icon: DollarSign },
    { id: 'budgets', label: '预算', icon: Wallet },
    { id: 'goals', label: '目标', icon: Target },
  ] as const

  return (
    <div style={{ background: colors.bg, color: colors.text, fontFamily: 'system-ui, sans-serif', minHeight: '100vh', padding: 24, overflowY: 'auto' }}>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Wallet size={24} style={{ color: colors.accent }} />财务管理
      </h2>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: `1px solid ${colors.cardBorder}`, paddingBottom: 12 }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              border: 'none',
              borderRadius: 8,
              background: activeTab === tab.id ? colors.accent : 'transparent',
              color: activeTab === tab.id ? '#000' : colors.textSecondary,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
              transition: 'all 0.2s',
            }}
          >
            <tab.icon size={16} />{tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'summary' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
            <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20, textAlign: 'center' }}>
              <div style={{ color: colors.income, fontSize: 24, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <TrendingUp size={20} />{summary.totalIncome.toLocaleString()}
              </div>
              <small style={{ color: colors.textSecondary }}>本月收入</small>
            </div>
            <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20, textAlign: 'center' }}>
              <div style={{ color: colors.expense, fontSize: 24, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <TrendingDown size={20} />{summary.totalExpense.toLocaleString()}
              </div>
              <small style={{ color: colors.textSecondary }}>本月支出</small>
            </div>
            <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20, textAlign: 'center' }}>
              <div style={{ color: summary.balance >= 0 ? colors.income : colors.expense, fontSize: 24, fontWeight: 700 }}>
                {summary.balance >= 0 ? '+' : ''}{summary.balance.toLocaleString()}
              </div>
              <small style={{ color: colors.textSecondary }}>本月结余</small>
            </div>
          </div>

          {budgetStatus.length > 0 && (
            <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
              <h3 style={{ fontSize: 14, marginBottom: 16, color: colors.textSecondary }}>预算状态</h3>
              {budgetStatus.map((b) => (
                <div key={b.category} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span>{b.category}</span>
                    <span style={{ color: b.percent > 80 ? colors.expense : colors.text }}>
                      {b.spent.toLocaleString()} / {b.limit.toLocaleString()} ({b.percent}%)
                    </span>
                  </div>
                  <div style={{ height: 8, background: colors.progressBg, borderRadius: 4 }}>
                    <div style={{ height: '100%', width: `${Math.min(100, b.percent)}%`, background: b.percent > 80 ? colors.expense : b.percent > 60 ? colors.warning : colors.accent, borderRadius: 4, transition: 'width 0.3s' }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {goalProgress.length > 0 && (
            <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ fontSize: 14, marginBottom: 16, color: colors.textSecondary }}>财务目标</h3>
              {goalProgress.map(({ goal, percent }) => (
                <div key={goal.id} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span>{goal.title}</span>
                    <span>{goal.currentAmount.toLocaleString()} / {goal.targetAmount.toLocaleString()} ({percent}%)</span>
                  </div>
                  <div style={{ height: 8, background: colors.progressBg, borderRadius: 4 }}>
                    <div style={{ height: '100%', width: `${percent}%`, background: colors.accent, borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'transactions' && (
        <div>
          <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, marginBottom: 16 }}>新增记账</h3>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <button
                onClick={() => setTxType('income')}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  border: 'none',
                  borderRadius: 8,
                  background: txType === 'income' ? colors.income : colors.inputBg,
                  color: txType === 'income' ? '#fff' : colors.textSecondary,
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                收入
              </button>
              <button
                onClick={() => setTxType('expense')}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  border: 'none',
                  borderRadius: 8,
                  background: txType === 'expense' ? colors.expense : colors.inputBg,
                  color: txType === 'expense' ? '#fff' : colors.textSecondary,
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                支出
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <input
                type="number"
                placeholder="金额"
                value={txAmount}
                onChange={(e) => setTxAmount(e.target.value)}
                style={{ padding: '10px 14px', border: `1px solid ${colors.inputBorder}`, borderRadius: 8, background: colors.inputBg, color: colors.text, fontSize: 14 }}
              />
              <select
                value={txCategory}
                onChange={(e) => setTxCategory(e.target.value)}
                style={{ padding: '10px 14px', border: `1px solid ${colors.inputBorder}`, borderRadius: 8, background: colors.inputBg, color: colors.text, fontSize: 14 }}
              >
                <option value="">选择分类</option>
                {financeCategories[txType].map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
              </select>
            </div>
            <input
              type="text"
              placeholder="备注（可选）"
              value={txDesc}
              onChange={(e) => setTxDesc(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', border: `1px solid ${colors.inputBorder}`, borderRadius: 8, background: colors.inputBg, color: colors.text, fontSize: 14, marginBottom: 12 }}
            />
            <button
              onClick={handleAddTransaction}
              style={{ width: '100%', padding: '12px 16px', border: 'none', borderRadius: 8, background: colors.accent, color: colors.text, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >
              记一笔
            </button>
          </div>

          <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20 }}>
            <h3 style={{ fontSize: 14, marginBottom: 16, color: colors.textSecondary }}>最近记录</h3>
            {state.transactions.length === 0 ? (
              <p style={{ color: colors.textSecondary, textAlign: 'center', padding: 20 }}>暂无记账记录</p>
            ) : (
              state.transactions.slice().reverse().slice(0, 10).map((tx) => (
                <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${colors.cardBorder}` }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{tx.category}</div>
                    <small style={{ color: colors.textSecondary }}>{tx.description || new Date(tx.date).toLocaleDateString('zh-CN')}</small>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: tx.type === 'income' ? colors.income : colors.expense, fontWeight: 600 }}>
                      {tx.type === 'income' ? '+' : '-'}{tx.amount.toLocaleString()}
                    </span>
                    <button
                      onClick={() => service.removeTransaction(tx.id)}
                      style={{ padding: 4, background: 'none', border: 'none', color: colors.textSecondary, cursor: 'pointer' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'budgets' && (
        <div>
          <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, marginBottom: 16 }}>设置预算</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <select
                value={budgetCategory}
                onChange={(e) => setBudgetCategory(e.target.value)}
                style={{ padding: '10px 14px', border: `1px solid ${colors.inputBorder}`, borderRadius: 8, background: colors.inputBg, color: colors.text, fontSize: 14 }}
              >
                <option value="">选择分类</option>
                {financeCategories.expense.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
              </select>
              <input
                type="number"
                placeholder="月度限额"
                value={budgetLimit}
                onChange={(e) => setBudgetLimit(e.target.value)}
                style={{ padding: '10px 14px', border: `1px solid ${colors.inputBorder}`, borderRadius: 8, background: colors.inputBg, color: colors.text, fontSize: 14 }}
              />
            </div>
            <button
              onClick={handleAddBudget}
              style={{ width: '100%', padding: '12px 16px', border: 'none', borderRadius: 8, background: colors.accent, color: colors.text, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >
              添加预算
            </button>
          </div>

          <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20 }}>
            <h3 style={{ fontSize: 14, marginBottom: 16, color: colors.textSecondary }}>我的预算</h3>
            {state.budgets.length === 0 ? (
              <p style={{ color: colors.textSecondary, textAlign: 'center', padding: 20 }}>暂无预算设置</p>
            ) : (
              state.budgets.map((budget) => {
                const status = budgetStatus.find((s) => s.category === budget.category)
                return (
                  <div key={budget.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${colors.cardBorder}` }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{budget.category}</div>
                      <small style={{ color: colors.textSecondary }}>限额: {budget.limit.toLocaleString()}</small>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: status && status.percent > 80 ? colors.expense : colors.text }}>
                        {status?.spent.toLocaleString() || 0}
                      </span>
                      <button
                        onClick={() => service.removeBudget(budget.id)}
                        style={{ padding: 4, background: 'none', border: 'none', color: colors.textSecondary, cursor: 'pointer' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {activeTab === 'goals' && (
        <div>
          <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, marginBottom: 16 }}>创建财务目标</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <input
                type="text"
                placeholder="目标名称"
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                style={{ padding: '10px 14px', border: `1px solid ${colors.inputBorder}`, borderRadius: 8, background: colors.inputBg, color: colors.text, fontSize: 14 }}
              />
              <input
                type="number"
                placeholder="目标金额"
                value={goalAmount}
                onChange={(e) => setGoalAmount(e.target.value)}
                style={{ padding: '10px 14px', border: `1px solid ${colors.inputBorder}`, borderRadius: 8, background: colors.inputBg, color: colors.text, fontSize: 14 }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <input
                type="date"
                value={goalDeadline}
                onChange={(e) => setGoalDeadline(e.target.value)}
                style={{ padding: '10px 14px', border: `1px solid ${colors.inputBorder}`, borderRadius: 8, background: colors.inputBg, color: colors.text, fontSize: 14 }}
              />
              <select
                value={goalCategory}
                onChange={(e) => setGoalCategory(e.target.value as FinanceGoal['category'])}
                style={{ padding: '10px 14px', border: `1px solid ${colors.inputBorder}`, borderRadius: 8, background: colors.inputBg, color: colors.text, fontSize: 14 }}
              >
                <option value="saving">储蓄</option>
                <option value="investment">投资</option>
                <option value="debt-repayment">还债</option>
                <option value="purchase">购物</option>
              </select>
            </div>
            <button
              onClick={handleAddGoal}
              style={{ width: '100%', padding: '12px 16px', border: 'none', borderRadius: 8, background: colors.accent, color: colors.text, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >
              创建目标
            </button>
          </div>

          <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20 }}>
            <h3 style={{ fontSize: 14, marginBottom: 16, color: colors.textSecondary }}>我的目标</h3>
            {state.goals.length === 0 ? (
              <p style={{ color: colors.textSecondary, textAlign: 'center', padding: 20 }}>暂无财务目标</p>
            ) : (
              state.goals.map((goal) => {
                const progress = goalProgress.find((p) => p.goal.id === goal.id)
                return (
                  <div key={goal.id} style={{ padding: '16px 0', borderBottom: `1px solid ${colors.cardBorder}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontWeight: 500 }}>{goal.title}</div>
                        <small style={{ color: colors.textSecondary }}>目标: {goal.targetAmount.toLocaleString()} · 截止: {goal.deadline}</small>
                      </div>
                      <button
                        onClick={() => service.removeGoal(goal.id)}
                        style={{ padding: 4, background: 'none', border: 'none', color: colors.textSecondary, cursor: 'pointer' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div style={{ height: 8, background: colors.progressBg, borderRadius: 4, marginBottom: 8 }}>
                      <div style={{ height: '100%', width: `${progress?.percent || 0}%`, background: colors.accent, borderRadius: 4 }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="number"
                        placeholder="当前存款"
                        value={goalDepositInputs[goal.id] ?? ''}
                        onChange={(e) => setGoalDepositInputs((prev) => ({ ...prev, [goal.id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const val = parseFloat(goalDepositInputs[goal.id] || '')
                            if (val >= 0) {
                              service.updateGoalProgress(goal.id, val)
                              setGoalDepositInputs((prev) => ({ ...prev, [goal.id]: '' }))
                            }
                          }
                        }}
                        style={{ flex: 1, padding: '8px 12px', border: `1px solid ${colors.inputBorder}`, borderRadius: 6, background: colors.inputBg, color: colors.text, fontSize: 13 }}
                      />
                      <span style={{ color: colors.textSecondary, fontSize: 13 }}>
                        {goal.currentAmount.toLocaleString()} / {goal.targetAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}