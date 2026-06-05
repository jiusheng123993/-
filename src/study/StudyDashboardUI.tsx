import { useState, useEffect, useCallback } from 'react'
import { Target, CheckCircle, BookOpen, Brain, Plus, Trash2, BarChart3 } from 'lucide-react'
import type { StudyGoal, StudyTask, StudyNote, ReviewItem } from '../data/localStudyStore'
import { createStudyService } from './studyService'
import type { StudyService } from './studyService'

interface StudyDashboardUIProps {
  compact?: boolean
  service?: StudyService
}

const colors = {
  bg: '#0f0f1a',
  cardBg: '#1a1a2e',
  cardBorder: '#2a2a4a',
  text: '#e0e0e0',
  textSecondary: '#8888aa',
  accent: '#6c63ff',
  accentLight: '#8b83ff',
  green: '#4caf50',
  yellow: '#ffc107',
  red: '#f44336',
  progressBg: '#2a2a4a',
  inputBg: '#12121f',
  inputBorder: '#2a2a4a',
  hoverBg: '#222240',
}

const progressGradient = `linear-gradient(90deg, ${colors.accent}, ${colors.accentLight})`

const styles = {
  compactCard: {
    background: colors.cardBg,
    border: `1px solid ${colors.cardBorder}`,
    borderRadius: 12,
    padding: 20,
    width: 300,
    color: colors.text,
    fontFamily: 'system-ui, sans-serif',
  } as React.CSSProperties,

  fullContainer: {
    background: colors.bg,
    color: colors.text,
    fontFamily: 'system-ui, sans-serif',
    minHeight: '100vh',
    padding: 24,
    overflowY: 'auto',
  } as React.CSSProperties,

  statsRow: {
    display: 'flex',
    gap: 16,
    marginBottom: 16,
  } as React.CSSProperties,

  statCard: {
    flex: 1,
    background: colors.cardBg,
    border: `1px solid ${colors.cardBorder}`,
    borderRadius: 10,
    padding: 14,
    textAlign: 'center',
  } as React.CSSProperties,

  statValue: {
    fontSize: 24,
    fontWeight: 700,
    color: colors.accentLight,
  } as React.CSSProperties,

  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  } as React.CSSProperties,

  sectionCard: {
    background: colors.cardBg,
    border: `1px solid ${colors.cardBorder}`,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  } as React.CSSProperties,

  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 14,
    color: colors.text,
  } as React.CSSProperties,

  progressBarOuter: {
    height: 8,
    background: colors.progressBg,
    borderRadius: 4,
    overflow: 'hidden',
    flex: 1,
  } as React.CSSProperties,

  progressBarInner: (pct: number): React.CSSProperties => ({
    height: '100%',
    width: `${Math.min(100, Math.max(0, pct))}%`,
    background: progressGradient,
    borderRadius: 4,
    transition: 'width 0.3s ease',
  }),

  input: {
    background: colors.inputBg,
    border: `1px solid ${colors.inputBorder}`,
    borderRadius: 6,
    padding: '6px 10px',
    color: colors.text,
    fontSize: 13,
    outline: 'none',
    flex: 1,
  } as React.CSSProperties,

  btn: {
    background: colors.accent,
    border: 'none',
    borderRadius: 6,
    padding: '6px 12px',
    color: '#fff',
    cursor: 'pointer',
    fontSize: 13,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  } as React.CSSProperties,

  btnDanger: {
    background: 'transparent',
    border: 'none',
    color: colors.red,
    cursor: 'pointer',
    padding: 4,
    display: 'flex',
    alignItems: 'center',
  } as React.CSSProperties,

  goalItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 0',
    borderBottom: `1px solid ${colors.cardBorder}`,
  } as React.CSSProperties,

  taskItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '6px 0',
  } as React.CSSProperties,

  noteItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: `1px solid ${colors.cardBorder}`,
  } as React.CSSProperties,

  reviewItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: `1px solid ${colors.cardBorder}`,
  } as React.CSSProperties,

  levelBadge: (level: string): React.CSSProperties => ({
    padding: '2px 8px',
    borderRadius: 10,
    fontSize: 11,
    fontWeight: 600,
    background: level === 'easy' ? colors.green : level === 'medium' ? colors.yellow : colors.red,
    color: colors.text,
  }),

  addForm: {
    display: 'flex',
    gap: 8,
    marginTop: 12,
  } as React.CSSProperties,

  select: {
    background: colors.inputBg,
    border: `1px solid ${colors.inputBorder}`,
    borderRadius: 6,
    padding: '6px 10px',
    color: colors.text,
    fontSize: 13,
    outline: 'none',
  } as React.CSSProperties,

  goalGroup: {
    marginBottom: 12,
  } as React.CSSProperties,

  goalGroupTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: colors.accentLight,
    marginBottom: 6,
  } as React.CSSProperties,
}

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div style={styles.progressBarOuter}>
      <div style={styles.progressBarInner(pct)} />
    </div>
  )
}

function CompactDashboard({ service }: { service: StudyService }) {
  const [progress, setProgress] = useState(service.getOverallProgress())
  const [goals, setGoals] = useState<StudyGoal[]>([])

  const refresh = useCallback(() => {
    setProgress(service.getOverallProgress())
    setGoals(service.getState().goals)
  }, [service])

  useEffect(() => {
    refresh()
  }, [refresh])

  const topGoals = goals.slice(0, 3)

  return (
    <div style={styles.compactCard}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <BarChart3 size={18} color={colors.accentLight} />
        <span style={{ fontWeight: 600, fontSize: 15 }}>学习概览</span>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, color: colors.textSecondary }}>
          <span>总体进度</span>
          <span>{progress.avgProgress}%</span>
        </div>
        <ProgressBar pct={progress.avgProgress} />
      </div>

      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{progress.totalGoals}</div>
          <div style={styles.statLabel}>目标</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{progress.completedTasks}/{progress.totalTasks}</div>
          <div style={styles.statLabel}>任务</div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statValue, color: progress.reviewDueCount > 0 ? colors.red : colors.green }}>
            {progress.reviewDueCount}
          </div>
          <div style={styles.statLabel}>待复习</div>
        </div>
      </div>

      {topGoals.length > 0 && (
        <div>
          <div style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 8 }}>目标进度</div>
          {topGoals.map((g) => (
            <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Target size={14} color={colors.accentLight} />
              <span style={{ fontSize: 12, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.title}</span>
              <span style={{ fontSize: 11, color: colors.textSecondary, minWidth: 32, textAlign: 'right' }}>{g.progress}%</span>
              <div style={{ width: 60 }}>
                <ProgressBar pct={g.progress} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function FullDashboard({ service }: { service: StudyService }) {
  const [state, setState] = useState(service.getState())
  const [progress, setProgress] = useState(service.getOverallProgress())

  const [newGoalTitle, setNewGoalTitle] = useState('')
  const [newGoalSubject, setNewGoalSubject] = useState('')
  const [newGoalDate, setNewGoalDate] = useState('')

  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskGoalId, setNewTaskGoalId] = useState('')
  const [newTaskMinutes, setNewTaskMinutes] = useState(30)

  const [newNoteTitle, setNewNoteTitle] = useState('')
  const [newNoteSubject, setNewNoteSubject] = useState('')

  const [newReviewTitle, setNewReviewTitle] = useState('')
  const [newReviewSubject, setNewReviewSubject] = useState('')
  const [newReviewDate, setNewReviewDate] = useState('')
  const [newReviewLevel, setNewReviewLevel] = useState<'easy' | 'medium' | 'hard'>('medium')

  const refresh = useCallback(() => {
    setState(service.getState())
    setProgress(service.getOverallProgress())
  }, [service])

  useEffect(() => {
    refresh()
  }, [refresh])

  const handleAddGoal = () => {
    if (!newGoalTitle.trim() || !newGoalSubject.trim()) return
    service.addGoal(newGoalTitle.trim(), newGoalSubject.trim(), newGoalDate || new Date().toISOString().slice(0, 10))
    setNewGoalTitle('')
    setNewGoalSubject('')
    setNewGoalDate('')
    refresh()
  }

  const handleRemoveGoal = (id: string) => {
    service.removeGoal(id)
    refresh()
  }

  const handleToggleTask = (id: string) => {
    service.toggleTask(id)
    refresh()
  }

  const handleRemoveTask = (id: string) => {
    service.removeTask(id)
    refresh()
  }

  const handleAddTask = () => {
    if (!newTaskTitle.trim() || !newTaskGoalId) return
    service.addTask(newTaskTitle.trim(), newTaskGoalId, newTaskMinutes)
    setNewTaskTitle('')
    setNewTaskMinutes(30)
    refresh()
  }

  const handleAddNote = () => {
    if (!newNoteTitle.trim() || !newNoteSubject.trim()) return
    service.addNote(newNoteTitle.trim(), newNoteSubject.trim())
    setNewNoteTitle('')
    setNewNoteSubject('')
    refresh()
  }

  const handleRemoveNote = (id: string) => {
    service.removeNote(id)
    refresh()
  }

  const handleAddReview = () => {
    if (!newReviewTitle.trim() || !newReviewSubject.trim()) return
    service.addReviewItem(newReviewTitle.trim(), newReviewSubject.trim(), newReviewDate || new Date().toISOString().slice(0, 10), newReviewLevel)
    setNewReviewTitle('')
    setNewReviewSubject('')
    setNewReviewDate('')
    setNewReviewLevel('medium')
    refresh()
  }

  const handleRemoveReview = (id: string) => {
    service.removeReviewItem(id)
    refresh()
  }

  const tasksByGoal = new Map<string, StudyTask[]>()
  for (const t of state.tasks) {
    const list = tasksByGoal.get(t.goalId) || []
    list.push(t)
    tasksByGoal.set(t.goalId, list)
  }

  const sortedReviews = [...state.reviews].sort((a, b) => a.dueDate.localeCompare(b.dueDate))

  return (
    <div style={styles.fullContainer}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
        <BarChart3 size={24} color={colors.accentLight} />
        学习仪表盘
      </h1>

      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{progress.totalGoals}</div>
          <div style={styles.statLabel}>学习目标</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{progress.avgProgress}%</div>
          <div style={styles.statLabel}>平均进度</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{progress.completedTasks}/{progress.totalTasks}</div>
          <div style={styles.statLabel}>已完成任务</div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statValue, color: progress.reviewDueCount > 0 ? colors.red : colors.green }}>
            {progress.reviewDueCount}
          </div>
          <div style={styles.statLabel}>待复习</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={styles.sectionCard}>
          <div style={styles.sectionTitle}>
            <Target size={18} color={colors.accentLight} />
            学习目标
          </div>
          {state.goals.length === 0 && (
            <div style={{ color: colors.textSecondary, fontSize: 13, padding: '12px 0' }}>暂无学习目标</div>
          )}
          {state.goals.map((g) => (
            <div key={g.id} style={styles.goalItem}>
              <Target size={16} color={colors.accentLight} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{g.title}</div>
                <div style={{ fontSize: 11, color: colors.textSecondary }}>{g.subject} · 截止 {g.targetDate}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <ProgressBar pct={g.progress} />
                  <span style={{ fontSize: 11, color: colors.textSecondary, minWidth: 32 }}>{g.progress}%</span>
                </div>
              </div>
              <button style={styles.btnDanger} onClick={() => handleRemoveGoal(g.id)} aria-label="删除目标">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <div style={styles.addForm}>
            <input
              style={styles.input}
              placeholder="目标名称"
              value={newGoalTitle}
              onChange={(e) => setNewGoalTitle(e.target.value)}
            />
            <input
              style={{ ...styles.input, maxWidth: 100 }}
              placeholder="科目"
              value={newGoalSubject}
              onChange={(e) => setNewGoalSubject(e.target.value)}
            />
            <input
              style={{ ...styles.input, maxWidth: 120 }}
              type="date"
              value={newGoalDate}
              onChange={(e) => setNewGoalDate(e.target.value)}
            />
            <button style={styles.btn} onClick={handleAddGoal}>
              <Plus size={14} /> 添加
            </button>
          </div>
        </div>

        <div style={styles.sectionCard}>
          <div style={styles.sectionTitle}>
            <CheckCircle size={18} color={colors.accentLight} />
            学习任务
          </div>
          {state.tasks.length === 0 && (
            <div style={{ color: colors.textSecondary, fontSize: 13, padding: '12px 0' }}>暂无学习任务</div>
          )}
          {state.goals.map((goal) => {
            const tasks = tasksByGoal.get(goal.id) || []
            if (tasks.length === 0) return null
            return (
              <div key={goal.id} style={styles.goalGroup}>
                <div style={styles.goalGroupTitle}>{goal.title}</div>
                {tasks.map((t) => (
                  <div key={t.id} style={styles.taskItem}>
                    <input
                      type="checkbox"
                      checked={t.status === 'done'}
                      onChange={() => handleToggleTask(t.id)}
                      style={{ accentColor: colors.accent }}
                    />
                    <span style={{
                      flex: 1,
                      fontSize: 13,
                      textDecoration: t.status === 'done' ? 'line-through' : 'none',
                      color: t.status === 'done' ? colors.textSecondary : colors.text,
                    }}>
                      {t.title}
                    </span>
                    <span style={{ fontSize: 11, color: colors.textSecondary }}>{t.minutes}分钟</span>
                    <button style={styles.btnDanger} onClick={() => handleRemoveTask(t.id)} aria-label="删除任务">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )
          })}
          <div style={styles.addForm}>
            <input
              style={styles.input}
              placeholder="任务名称"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
            />
            <select
              style={styles.select}
              value={newTaskGoalId}
              onChange={(e) => setNewTaskGoalId(e.target.value)}
            >
              <option value="">选择目标</option>
              {state.goals.map((g) => (
                <option key={g.id} value={g.id}>{g.title}</option>
              ))}
            </select>
            <input
              style={{ ...styles.input, maxWidth: 60 }}
              type="number"
              min={1}
              value={newTaskMinutes}
              onChange={(e) => setNewTaskMinutes(Number(e.target.value))}
            />
            <button style={styles.btn} onClick={handleAddTask}>
              <Plus size={14} /> 添加
            </button>
          </div>
        </div>

        <div style={styles.sectionCard}>
          <div style={styles.sectionTitle}>
            <BookOpen size={18} color={colors.accentLight} />
            学习笔记
          </div>
          {state.notes.length === 0 && (
            <div style={{ color: colors.textSecondary, fontSize: 13, padding: '12px 0' }}>暂无笔记</div>
          )}
          {state.notes.map((n) => (
            <div key={n.id} style={styles.noteItem}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{n.title}</div>
                <div style={{ fontSize: 11, color: colors.textSecondary }}>{n.subject} · {n.updatedAt}</div>
              </div>
              <button style={styles.btnDanger} onClick={() => handleRemoveNote(n.id)} aria-label="删除笔记">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <div style={styles.addForm}>
            <input
              style={styles.input}
              placeholder="笔记标题"
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
            />
            <input
              style={{ ...styles.input, maxWidth: 100 }}
              placeholder="科目"
              value={newNoteSubject}
              onChange={(e) => setNewNoteSubject(e.target.value)}
            />
            <button style={styles.btn} onClick={handleAddNote}>
              <Plus size={14} /> 添加
            </button>
          </div>
        </div>

        <div style={styles.sectionCard}>
          <div style={styles.sectionTitle}>
            <Brain size={18} color={colors.accentLight} />
            复习计划
          </div>
          {state.reviews.length === 0 && (
            <div style={{ color: colors.textSecondary, fontSize: 13, padding: '12px 0' }}>暂无复习项</div>
          )}
          {sortedReviews.map((r) => (
            <div key={r.id} style={styles.reviewItem}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={styles.levelBadge(r.level)}>
                  {r.level === 'easy' ? '简单' : r.level === 'medium' ? '中等' : '困难'}
                </span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{r.title}</div>
                  <div style={{ fontSize: 11, color: colors.textSecondary }}>{r.subject} · {r.dueDate}</div>
                </div>
              </div>
              <button style={styles.btnDanger} onClick={() => handleRemoveReview(r.id)} aria-label="删除复习项">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <div style={styles.addForm}>
            <input
              style={styles.input}
              placeholder="复习内容"
              value={newReviewTitle}
              onChange={(e) => setNewReviewTitle(e.target.value)}
            />
            <input
              style={{ ...styles.input, maxWidth: 100 }}
              placeholder="科目"
              value={newReviewSubject}
              onChange={(e) => setNewReviewSubject(e.target.value)}
            />
            <input
              style={{ ...styles.input, maxWidth: 120 }}
              type="date"
              value={newReviewDate}
              onChange={(e) => setNewReviewDate(e.target.value)}
            />
            <select
              style={styles.select}
              value={newReviewLevel}
              onChange={(e) => setNewReviewLevel(e.target.value as 'easy' | 'medium' | 'hard')}
            >
              <option value="easy">简单</option>
              <option value="medium">中等</option>
              <option value="hard">困难</option>
            </select>
            <button style={styles.btn} onClick={handleAddReview}>
              <Plus size={14} /> 添加
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function StudyDashboardUI({ compact = false, service: externalService }: StudyDashboardUIProps) {
  const [service] = useState(() => externalService ?? createStudyService())

  if (compact) {
    return <CompactDashboard service={service} />
  }

  return <FullDashboard service={service} />
}

export default StudyDashboardUI
