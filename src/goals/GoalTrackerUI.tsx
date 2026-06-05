import { useState, useCallback } from 'react'
import type { GoalState, Objective, KeyResult, GoalStore } from './goalService'
import {
  createGoalBrowserStore,
  createObjective,
  updateObjective,
  deleteObjective,
  addKeyResult,
  updateKeyResult,
  deleteKeyResult,
  completeObjective,
  getActiveObjectives,
  getOverallProgress,
  CATEGORY_OPTIONS,
  PRIORITY_OPTIONS
} from './goalService'

const goalStore: GoalStore = createGoalBrowserStore()

interface GoalTrackerUIProps {
  onClose?: () => void
  compact?: boolean
}

export function GoalTrackerUI({ onClose, compact = false }: GoalTrackerUIProps) {
  const [state, setState] = useState<GoalState>(() => goalStore.load())
  const [showAddForm, setShowAddForm] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    category: 'learning' as Objective['category'],
    priority: 'medium' as Objective['priority'],
    targetDate: ''
  })
  const [newKrTitle, setNewKrTitle] = useState('')
  const [newKrTarget, setNewKrTarget] = useState(10)
  const [newKrUnit, setNewKrUnit] = useState('个')

  const activeObjectives = getActiveObjectives(state)
  const overallProgress = getOverallProgress(state)

  const persistState = useCallback((newState: GoalState) => {
    setState(newState)
    goalStore.save(newState)
  }, [])

  const handleCreateGoal = () => {
    if (!newGoal.title.trim()) return
    persistState(createObjective(state, {
      title: newGoal.title.trim(),
      description: newGoal.description.trim(),
      category: newGoal.category,
      status: 'active',
      priority: newGoal.priority,
      startDate: new Date().toISOString().slice(0, 10),
      targetDate: newGoal.targetDate || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
    }))
    setNewGoal({ title: '', description: '', category: 'learning', priority: 'medium', targetDate: '' })
    setShowAddForm(false)
  }

  const handleAddKR = (objectiveId: string) => {
    if (!newKrTitle.trim()) return
    persistState(addKeyResult(state, objectiveId, {
      title: newKrTitle.trim(),
      target: newKrTarget,
      current: 0,
      unit: newKrUnit
    }))
    setNewKrTitle('')
  }

  const handleKrProgress = (objectiveId: string, krId: string, delta: number) => {
    const obj = state.objectives.find((o) => o.id === objectiveId)
    const kr = obj?.keyResults.find((k) => k.id === krId)
    if (!kr) return
    const newCurrent = Math.max(0, Math.min(kr.target, kr.current + delta))
    persistState(updateKeyResult(state, objectiveId, krId, { current: newCurrent }))
  }

  const handleCompleteGoal = (id: string) => {
    persistState(completeObjective(state, id))
  }

  const handleDeleteGoal = (id: string) => {
    persistState(deleteObjective(state, id))
  }

  if (compact) {
    return <CompactGoalView
      activeObjectives={activeObjectives}
      overallProgress={overallProgress}
      totalCompleted={state.totalCompleted}
    />
  }

  return (
    <div className="goal-tracker" role="region" aria-label="目标管理">
      <div className="goal-header">
        <div>
          <p className="eyebrow">Goal Tracker · 目标管理</p>
          <h2>我的目标</h2>
        </div>
        <div className="goal-stats">
          <div className="goal-progress-ring" style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: `conic-gradient(var(--primary) ${overallProgress * 3.6}deg, var(--surface-elevated) 0deg)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>{overallProgress}%</span>
          </div>
        </div>
      </div>

      <div className="goal-summary" style={{
        display: 'flex',
        gap: 12,
        marginBottom: 16
      }}>
        <div style={{
          flex: 1,
          padding: 12,
          borderRadius: 10,
          background: 'var(--surface-elevated)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{state.totalActive}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>进行中</div>
        </div>
        <div style={{
          flex: 1,
          padding: 12,
          borderRadius: 10,
          background: 'var(--surface-elevated)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--success, #10b981)' }}>{state.totalCompleted}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>已完成</div>
        </div>
      </div>

      <div className="goal-list">
        {activeObjectives.length === 0 && state.objectives.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 30, color: 'var(--muted)' }}>
            <p style={{ fontSize: 32, margin: '0 0 8px' }}>🎯</p>
            <p>还没有设定目标，开始你的第一个目标吧！</p>
          </div>
        ) : (
          state.objectives
            .filter((o) => o.status === 'active')
            .map((obj) => (
              <GoalCard
                key={obj.id}
                objective={obj}
                isExpanded={expandedId === obj.id}
                onToggleExpand={() => setExpandedId(expandedId === obj.id ? null : obj.id)}
                onComplete={() => handleCompleteGoal(obj.id)}
                onDelete={() => handleDeleteGoal(obj.id)}
                onKrProgress={(krId, delta) => handleKrProgress(obj.id, krId, delta)}
                onAddKR={() => handleAddKR(obj.id)}
                newKrTitle={newKrTitle}
                newKrTarget={newKrTarget}
                newKrUnit={newKrUnit}
                onNewKrTitleChange={setNewKrTitle}
                onNewKrTargetChange={setNewKrTarget}
                onNewKrUnitChange={setNewKrUnit}
              />
            ))
        )}
      </div>

      {showAddForm ? (
        <div className="goal-add-form" style={{
          padding: 16,
          borderRadius: 12,
          background: 'var(--surface-elevated)',
          marginTop: 12
        }}>
          <input
            type="text"
            placeholder="目标标题"
            value={newGoal.title}
            onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--text)',
              fontSize: 14,
              marginBottom: 8,
              boxSizing: 'border-box'
            }}
          />
          <textarea
            placeholder="目标描述（可选）"
            value={newGoal.description}
            onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
            rows={2}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--text)',
              fontSize: 13,
              resize: 'vertical',
              marginBottom: 8,
              boxSizing: 'border-box',
              fontFamily: 'inherit'
            }}
          />
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <select
              value={newGoal.category}
              onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value as Objective['category'] })}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text)',
                fontSize: 13
              }}
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
              ))}
            </select>
            <select
              value={newGoal.priority}
              onChange={(e) => setNewGoal({ ...newGoal, priority: e.target.value as Objective['priority'] })}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text)',
                fontSize: 13
              }}
            >
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
          <input
            type="date"
            value={newGoal.targetDate}
            onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--text)',
              fontSize: 13,
              marginBottom: 8,
              boxSizing: 'border-box'
            }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleCreateGoal}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: 8,
                border: 'none',
                background: 'var(--primary)',
                color: '#fff',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              创建目标
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--text)',
                cursor: 'pointer'
              }}
            >
              取消
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: 12,
            border: '2px dashed var(--border)',
            background: 'transparent',
            color: 'var(--muted)',
            cursor: 'pointer',
            marginTop: 12,
            fontSize: 14
          }}
        >
          + 创建新目标
        </button>
      )}

      {state.objectives.filter((o) => o.status === 'completed').length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h3 style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 8 }}>已完成的目标</h3>
          {state.objectives
            .filter((o) => o.status === 'completed')
            .slice(0, 5)
            .map((obj) => (
              <div key={obj.id} style={{
                padding: '8px 12px',
                borderRadius: 8,
                background: 'var(--surface-elevated)',
                marginBottom: 4,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                opacity: 0.7
              }}>
                <span>✅</span>
                <span style={{ fontSize: 13, textDecoration: 'line-through' }}>{obj.title}</span>
              </div>
            ))}
        </div>
      )}

      {onClose && (
        <div style={{ marginTop: 16 }}>
          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text)',
              cursor: 'pointer'
            }}
          >
            关闭
          </button>
        </div>
      )}
    </div>
  )
}

function GoalCard({
  objective,
  isExpanded,
  onToggleExpand,
  onComplete,
  onDelete,
  onKrProgress,
  onAddKR,
  newKrTitle,
  newKrTarget,
  newKrUnit,
  onNewKrTitleChange,
  onNewKrTargetChange,
  onNewKrUnitChange
}: {
  objective: Objective
  isExpanded: boolean
  onToggleExpand: () => void
  onComplete: () => void
  onDelete: () => void
  onKrProgress: (krId: string, delta: number) => void
  onAddKR: () => void
  newKrTitle: string
  newKrTarget: number
  newKrUnit: string
  onNewKrTitleChange: (v: string) => void
  onNewKrTargetChange: (v: number) => void
  onNewKrUnitChange: (v: string) => void
}) {
  const categoryIcon = CATEGORY_OPTIONS.find((c) => c.value === objective.category)?.icon || '🎯'
  const priorityColor = PRIORITY_OPTIONS.find((p) => p.value === objective.priority)?.color || '#6b7280'

  return (
    <div style={{
      padding: 14,
      borderRadius: 12,
      background: 'var(--surface-elevated)',
      marginBottom: 8,
      border: `1px solid var(--border)`
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }} onClick={onToggleExpand}>
        <span style={{ fontSize: 20 }}>{categoryIcon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <strong style={{ fontSize: 14 }}>{objective.title}</strong>
            <span style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: priorityColor,
              display: 'inline-block'
            }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <div style={{
              flex: 1,
              height: 6,
              borderRadius: 3,
              background: 'var(--border)',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${objective.progress}%`,
                background: objective.progress >= 100 ? 'var(--success, #10b981)' : 'var(--primary)',
                borderRadius: 3,
                transition: 'width 300ms ease'
              }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, minWidth: 32, textAlign: 'right' }}>
              {objective.progress}%
            </span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
            {objective.keyResults.length} 个关键结果 · 截止 {objective.targetDate}
          </div>
        </div>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>
          {isExpanded ? '▲' : '▼'}
        </span>
      </div>

      {isExpanded && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
          {objective.keyResults.length > 0 ? (
            objective.keyResults.map((kr) => (
              <div key={kr.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 0',
                borderBottom: '1px solid var(--border)'
              }}>
                <span style={{ fontSize: 12 }}>
                  {kr.isCompleted ? '✅' : '⬜'}
                </span>
                <span style={{ flex: 1, fontSize: 13, textDecoration: kr.isCompleted ? 'line-through' : 'none' }}>
                  {kr.title}
                </span>
                <span style={{ fontSize: 12, color: 'var(--muted)', minWidth: 60, textAlign: 'right' }}>
                  {kr.current}/{kr.target} {kr.unit}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); onKrProgress(kr.id, -1) }}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    color: 'var(--text)',
                    cursor: 'pointer',
                    fontSize: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0
                  }}
                >
                  −
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onKrProgress(kr.id, 1) }}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    color: 'var(--text)',
                    cursor: 'pointer',
                    fontSize: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0
                  }}
                >
                  +
                </button>
              </div>
            ))
          ) : (
            <p style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>暂无关键结果，添加一个吧</p>
          )}

          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <input
              type="text"
              placeholder="关键结果"
              value={newKrTitle}
              onChange={(e) => onNewKrTitleChange(e.target.value)}
              style={{
                flex: 1,
                padding: '6px 10px',
                borderRadius: 6,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text)',
                fontSize: 12,
                boxSizing: 'border-box'
              }}
            />
            <input
              type="number"
              value={newKrTarget}
              onChange={(e) => onNewKrTargetChange(Number(e.target.value))}
              min={1}
              style={{
                width: 50,
                padding: '6px 8px',
                borderRadius: 6,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text)',
                fontSize: 12,
                boxSizing: 'border-box'
              }}
            />
            <input
              type="text"
              value={newKrUnit}
              onChange={(e) => onNewKrUnitChange(e.target.value)}
              style={{
                width: 40,
                padding: '6px 8px',
                borderRadius: 6,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text)',
                fontSize: 12,
                boxSizing: 'border-box'
              }}
            />
            <button
              onClick={(e) => { e.stopPropagation(); onAddKR() }}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                border: 'none',
                background: 'var(--primary)',
                color: '#fff',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600
              }}
            >
              添加
            </button>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button
              onClick={(e) => { e.stopPropagation(); onComplete() }}
              style={{
                flex: 1,
                padding: '6px',
                borderRadius: 6,
                border: '1px solid var(--success, #10b981)',
                background: 'transparent',
                color: 'var(--success, #10b981)',
                cursor: 'pointer',
                fontSize: 12
              }}
            >
              ✓ 完成目标
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete() }}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--muted)',
                cursor: 'pointer',
                fontSize: 12
              }}
            >
              删除
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function CompactGoalView({
  activeObjectives,
  overallProgress,
  totalCompleted
}: {
  activeObjectives: Objective[]
  overallProgress: number
  totalCompleted: number
}) {
  return (
    <div className="goal-compact" role="region" aria-label="目标概览">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <strong>目标进度</strong>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>{overallProgress}%</span>
      </div>
      {activeObjectives.length === 0 ? (
        <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>暂无活跃目标</p>
      ) : (
        activeObjectives.slice(0, 3).map((obj) => (
          <div key={obj.id} style={{ marginBottom: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 2 }}>
              <span>{CATEGORY_OPTIONS.find((c) => c.value === obj.category)?.icon} {obj.title}</span>
              <span style={{ fontWeight: 600 }}>{obj.progress}%</span>
            </div>
            <div style={{
              height: 4,
              borderRadius: 2,
              background: 'var(--border)',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${obj.progress}%`,
                background: 'var(--primary)',
                borderRadius: 2
              }} />
            </div>
          </div>
        ))
      )}
      {totalCompleted > 0 && (
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
          ✅ {totalCompleted} 个已完成
        </div>
      )}
    </div>
  )
}
