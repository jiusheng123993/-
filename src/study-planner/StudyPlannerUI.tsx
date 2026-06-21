import { useState, useCallback, useEffect } from 'react'
import {
  getStudyPlans,
  addStudyPlan,
  deleteStudyPlan,
  updateStudyPlan,
  addPhase,
  deletePhase,
  addTask,
  updateTask,
  deleteTask,
  toggleTask,
  getPlanProgress,
  getTodayTasks,
  type StudyPlan,
  type StudyTask,
  type TargetScore,
  type PlanProgress
} from './studyPlannerService'
import { sendAgentChatMessageStream } from '../agent/agentRuntime'
import { useApiKeyStatus } from '../hooks/useApiKeyStatus'
import { createEntitlementService } from '../entitlement/entitlementService'
import styles from './StudyPlannerUI.module.css'

const DEFAULT_SUBJECTS = ['数学', '语文', '英语', '物理', '化学', '生物', '历史', '地理', '政治']
const DEFAULT_PHASE_NAMES = ['基础巩固', '专题突破', '冲刺保温']

interface StudyPlannerUIProps {
  userId?: string
}

export function StudyPlannerUI({ userId }: StudyPlannerUIProps) {
  const [plans, setPlans] = useState<StudyPlan[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [showAddPlanForm, setShowAddPlanForm] = useState(false)
  const [showAddPhaseForm, setShowAddPhaseForm] = useState(false)
  const [showAddTaskForm, setShowAddTaskForm] = useState<string | null>(null)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)

  const [planName, setPlanName] = useState('')
  const [planExamDate, setPlanExamDate] = useState('')
  const [planTargetScores, setPlanTargetScores] = useState<TargetScore[]>([
    { subject: '数学', targetScore: 0, totalScore: 150 }
  ])

  const [phaseName, setPhaseName] = useState('')
  const [phaseStartDate, setPhaseStartDate] = useState('')
  const [phaseEndDate, setPhaseEndDate] = useState('')

  const [taskTitle, setTaskTitle] = useState('')
  const [taskSubject, setTaskSubject] = useState('数学')
  const [taskMinutes, setTaskMinutes] = useState(30)
  const [editTaskTitle, setEditTaskTitle] = useState('')
  const [editTaskSubject, setEditTaskSubject] = useState('')
  const [editTaskMinutes, setEditTaskMinutes] = useState(30)

  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiSuggestionLoading, setAiSuggestionLoading] = useState(false)
  const [aiSuggestionError, setAiSuggestionError] = useState<string | null>(null)

  const { hasAnyKey } = useApiKeyStatus()

  const entitlementService = createEntitlementService()
  const isMember = userId ? (
    entitlementService.has(userId, 'study') ||
    entitlementService.has(userId, 'agent') ||
    entitlementService.has(userId, 'agent_plus')
  ) : false

  const canUseAI = isMember && hasAnyKey

  const loadData = useCallback(() => {
    setPlans(getStudyPlans())
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const selectedPlan = plans.find(p => p.id === selectedPlanId) ?? null
  const progress = selectedPlan ? getPlanProgress(selectedPlan) : null
  const todayTasks = selectedPlan ? getTodayTasks(selectedPlan) : []

  const resetAddPlanForm = () => {
    setPlanName('')
    setPlanExamDate('')
    setPlanTargetScores([{ subject: '数学', targetScore: 0, totalScore: 150 }])
  }

  const resetAddPhaseForm = () => {
    setPhaseName('')
    setPhaseStartDate('')
    setPhaseEndDate('')
  }

  const resetAddTaskForm = () => {
    setTaskTitle('')
    setTaskSubject('数学')
    setTaskMinutes(30)
  }

  const handleAddPlan = () => {
    if (!planName.trim() || !planExamDate) return
    addStudyPlan({
      name: planName.trim(),
      examDate: planExamDate,
      targetScores: planTargetScores.filter(s => s.subject.trim()),
      phases: []
    })
    resetAddPlanForm()
    setShowAddPlanForm(false)
    loadData()
  }

  const handleDeletePlan = (id: string) => {
    deleteStudyPlan(id)
    if (selectedPlanId === id) setSelectedPlanId(null)
    loadData()
  }

  const handleAddTargetScoreRow = () => {
    setPlanTargetScores(prev => [...prev, { subject: '', targetScore: 0, totalScore: 100 }])
  }

  const handleRemoveTargetScoreRow = (index: number) => {
    setPlanTargetScores(prev => prev.filter((_, i) => i !== index))
  }

  const handleTargetScoreChange = (index: number, field: keyof TargetScore, value: string | number) => {
    setPlanTargetScores(prev => prev.map((s, i) => {
      if (i !== index) return s
      return { ...s, [field]: field === 'subject' ? String(value) : Number(value) || 0 }
    }))
  }

  const handleAddPhase = () => {
    if (!selectedPlanId || !phaseName.trim() || !phaseStartDate || !phaseEndDate) return
    addPhase(selectedPlanId, {
      name: phaseName.trim(),
      startDate: phaseStartDate,
      endDate: phaseEndDate,
      tasks: []
    })
    resetAddPhaseForm()
    setShowAddPhaseForm(false)
    loadData()
  }

  const handleDeletePhase = (phaseId: string) => {
    if (!selectedPlanId) return
    deletePhase(selectedPlanId, phaseId)
    loadData()
  }

  const handleAddTask = (phaseId: string) => {
    if (!selectedPlanId || !taskTitle.trim()) return
    addTask(selectedPlanId, phaseId, {
      title: taskTitle.trim(),
      subject: taskSubject,
      completed: false,
      estimatedMinutes: taskMinutes
    })
    resetAddTaskForm()
    setShowAddTaskForm(null)
    loadData()
  }

  const handleToggleTask = (phaseId: string, taskId: string) => {
    if (!selectedPlanId) return
    toggleTask(selectedPlanId, phaseId, taskId)
    loadData()
  }

  const handleDeleteTask = (phaseId: string, taskId: string) => {
    if (!selectedPlanId) return
    deleteTask(selectedPlanId, phaseId, taskId)
    loadData()
  }

  const handleStartEditTask = (task: StudyTask) => {
    setEditingTaskId(task.id)
    setEditTaskTitle(task.title)
    setEditTaskSubject(task.subject)
    setEditTaskMinutes(task.estimatedMinutes)
  }

  const handleSaveEditTask = (phaseId: string) => {
    if (!selectedPlanId || !editingTaskId || !editTaskTitle.trim()) return
    updateTask(selectedPlanId, phaseId, editingTaskId, {
      title: editTaskTitle.trim(),
      subject: editTaskSubject,
      estimatedMinutes: editTaskMinutes
    })
    setEditingTaskId(null)
    loadData()
  }

  const handleAIGeneratePlan = async () => {
    if (!selectedPlan || !canUseAI) return
    setAiLoading(true)
    setAiError(null)

    const subjects = selectedPlan.targetScores.map(s => `${s.subject}(目标${s.targetScore}/${s.totalScore})`).join('、')

    const examDateObj = new Date(selectedPlan.examDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const remainingDays = Math.max(1, Math.ceil((examDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))

    try {
      let fullResponse = ''
      await sendAgentChatMessageStream({
        message: `考试名称：${selectedPlan.name}，考试日期：${selectedPlan.examDate}，剩余天数：${remainingDays}天，科目目标：${subjects}。请生成分阶段复习计划。`,
        personaId: 'exam-student',
        useXFYunCoding: true,
        systemPrompt: `你是备考规划师。根据用户提供的考试目标、剩余天数和科目，生成分阶段复习计划。
用JSON格式返回，包含3-4个阶段，每个阶段包含任务列表：
{
  "phases": [
    {
      "name": "阶段名称",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "tasks": [
        {"title": "任务描述", "subject": "科目", "estimatedMinutes": 30}
      ]
    }
  ]
}
要求：
- 阶段按基础巩固→专题突破→冲刺保温顺序
- 根据剩余天数合理分配每个阶段的天数
- 每个阶段3-6个具体可执行任务
- 任务要具体到可执行的行动，如"完成数学三角函数专项练习册P1-10"
- 只返回JSON，不要其他内容`,
        onChunk: (chunk) => { fullResponse += chunk }
      })

      const jsonMatch = fullResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0])
        if (result.phases && Array.isArray(result.phases)) {
          for (const phase of result.phases) {
            if (phase.name && phase.startDate && phase.endDate && Array.isArray(phase.tasks)) {
              const newPhase = addPhase(selectedPlan.id, {
                name: phase.name,
                startDate: phase.startDate,
                endDate: phase.endDate,
                tasks: []
              })
              if (newPhase) {
                for (const task of phase.tasks) {
                  if (task.title) {
                    addTask(selectedPlan.id, newPhase.id, {
                      title: task.title,
                      subject: task.subject || '通用',
                      completed: false,
                      estimatedMinutes: task.estimatedMinutes || 30
                    })
                  }
                }
              }
            }
          }
          loadData()
        } else {
          setAiError('AI 返回格式不正确，请重试')
        }
      } else {
        setAiError('AI 返回格式解析失败，请重试')
      }
    } catch {
      setAiError('AI 生成失败，请重试')
    } finally {
      setAiLoading(false)
    }
  }

  const handleAIDailySuggestion = async () => {
    if (!selectedPlan || !canUseAI) return
    setAiSuggestionLoading(true)
    setAiSuggestionError(null)

    const progress = getPlanProgress(selectedPlan)
    const todayTasks = getTodayTasks(selectedPlan)
    const pendingToday = todayTasks.filter(t => !t.task.completed).map(t => t.task.title).join('；')
    const completedToday = todayTasks.filter(t => t.task.completed).map(t => t.task.title).join('；')

    const examTrackerData = (() => {
      try {
        const raw = window.localStorage.getItem('xinghuanhai-examtracker-state')
        if (raw) {
          const data = JSON.parse(raw)
          if (data.records && data.records.length >= 2) {
            const latest = data.records[0]
            const prev = data.records[1]
            return `最近考试：《${latest.name}》与《${prev.name}》`
          }
        }
      } catch { /* ignore */ }
      return ''
    })()

    try {
      let fullResponse = ''
      await sendAgentChatMessageStream({
        message: [
          `学习计划：${selectedPlan.name}`,
          `考试日期：${selectedPlan.examDate}`,
          `总进度：${Math.round(progress.completionRate * 100)}%（${progress.completedTasks}/${progress.totalTasks}）`,
          `剩余天数：${progress.remainingDays}天`,
          pendingToday ? `今日未完成任务：${pendingToday}` : '',
          completedToday ? `今日已完成：${completedToday}` : '',
          examTrackerData,
          '请给出明日学习建议。'
        ].filter(Boolean).join('\n'),
        personaId: 'exam-student',
        useXFYunCoding: true,
        systemPrompt: `你是备考伙伴。根据用户的学习计划进度、今日任务完成情况和考试记录数据，给出温暖实用的明日学习建议。
用JSON格式返回：
{
  "suggestion": "建议内容，包含优先科目和具体行动建议，语气温暖鼓励",
  "prioritySubject": "建议优先复习的科目"
}
只返回JSON，不要其他内容`,
        onChunk: (chunk) => { fullResponse += chunk }
      })

      const jsonMatch = fullResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0])
        if (result.suggestion) {
          updateStudyPlan(selectedPlan.id, { aiDailySuggestion: result.suggestion })
          loadData()
        } else {
          setAiSuggestionError('AI 返回格式不正确')
        }
      } else {
        setAiSuggestionError('AI 返回格式解析失败')
      }
    } catch {
      setAiSuggestionError('AI 建议生成失败')
    } finally {
      setAiSuggestionLoading(false)
    }
  }

  const getSubjectColor = (subject: string) => {
    const colors: Record<string, string> = {
      '数学': '#3b82f6',
      '语文': '#22c55e',
      '英语': '#ef4444',
      '物理': '#f97316',
      '化学': '#8b5cf6',
      '生物': '#10b981',
      '历史': '#eab308',
      '地理': '#06b6d4',
      '政治': '#ec4899'
    }
    return colors[subject] || '#8b5cf6'
  }

  const formatProgressBar = (rate: number) => {
    const pct = Math.round(rate * 100)
    if (pct === 0) return styles.progressEmpty
    if (pct < 33) return styles.progressLow
    if (pct < 66) return styles.progressMid
    return styles.progressHigh
  }

  const renderAddPlanForm = () => (
    <div className={styles.addForm}>
      <div className={styles.formTitle}>创建学习计划</div>

      <input
        className={styles.input}
        type="text"
        placeholder="考试名称（如：高考复习、期末冲刺）"
        value={planName}
        onChange={e => setPlanName(e.target.value)}
      />

      <input
        className={styles.input}
        type="date"
        value={planExamDate}
        onChange={e => setPlanExamDate(e.target.value)}
      />

      <div className={styles.scoresSection}>
        <span className={styles.scoresLabel}>目标分数</span>
        {planTargetScores.map((score, index) => (
          <div key={index} className={styles.targetScoreRow}>
            <select
              className={styles.select}
              value={score.subject}
              onChange={e => handleTargetScoreChange(index, 'subject', e.target.value)}
            >
              <option value="">选择科目</option>
              {[...new Set([...DEFAULT_SUBJECTS, ...planTargetScores.map(s => s.subject).filter(Boolean)])].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <input
              className={styles.input}
              type="number"
              placeholder="目标分"
              value={score.targetScore || ''}
              onChange={e => handleTargetScoreChange(index, 'targetScore', e.target.value)}
            />
            <input
              className={styles.input}
              type="number"
              placeholder="满分"
              value={score.totalScore || ''}
              onChange={e => handleTargetScoreChange(index, 'totalScore', e.target.value)}
            />
            {planTargetScores.length > 1 && (
              <button className={styles.removeRowButton} onClick={() => handleRemoveTargetScoreRow(index)}>✕</button>
            )}
          </div>
        ))}
        <button className={styles.addRowButton} onClick={handleAddTargetScoreRow}>+ 添加科目</button>
      </div>

      <div className={styles.formActions}>
        <button className={styles.cancelButton} onClick={() => { resetAddPlanForm(); setShowAddPlanForm(false) }}>取消</button>
        <button className={styles.submitButton} disabled={!planName.trim() || !planExamDate} onClick={handleAddPlan}>
          创建计划
        </button>
      </div>
    </div>
  )

  const renderAddPhaseForm = () => (
    <div className={styles.addForm}>
      <div className={styles.formTitle}>添加阶段</div>

      <select
        className={styles.select}
        value={phaseName}
        onChange={e => setPhaseName(e.target.value)}
      >
        <option value="">选择阶段类型</option>
        {DEFAULT_PHASE_NAMES.map(name => (
          <option key={name} value={name}>{name}</option>
        ))}
      </select>

      <input
        className={styles.input}
        type="text"
        placeholder="自定义阶段名称"
        value={phaseName}
        onChange={e => setPhaseName(e.target.value)}
      />

      <div className={styles.dateRow}>
        <div className={styles.dateField}>
          <span className={styles.dateLabel}>开始</span>
          <input
            className={styles.input}
            type="date"
            value={phaseStartDate}
            onChange={e => setPhaseStartDate(e.target.value)}
          />
        </div>
        <div className={styles.dateField}>
          <span className={styles.dateLabel}>结束</span>
          <input
            className={styles.input}
            type="date"
            value={phaseEndDate}
            onChange={e => setPhaseEndDate(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.formActions}>
        <button className={styles.cancelButton} onClick={() => { resetAddPhaseForm(); setShowAddPhaseForm(false) }}>取消</button>
        <button className={styles.submitButton} disabled={!phaseName.trim() || !phaseStartDate || !phaseEndDate} onClick={handleAddPhase}>
          添加阶段
        </button>
      </div>
    </div>
  )

  const renderAddTaskForm = (phaseId: string) => (
    <div className={styles.addForm}>
      <div className={styles.formTitle}>添加任务</div>

      <input
        className={styles.input}
        type="text"
        placeholder="任务标题"
        value={taskTitle}
        onChange={e => setTaskTitle(e.target.value)}
      />

      <div className={styles.taskFormRow}>
        <select
          className={styles.select}
          value={taskSubject}
          onChange={e => setTaskSubject(e.target.value)}
        >
          {DEFAULT_SUBJECTS.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <div className={styles.minutesField}>
          <input
            className={styles.input}
            type="number"
            min={5}
            max={480}
            value={taskMinutes}
            onChange={e => setTaskMinutes(Math.max(5, Number(e.target.value) || 30))}
          />
          <span className={styles.minutesLabel}>分钟</span>
        </div>
      </div>

      <div className={styles.formActions}>
        <button className={styles.cancelButton} onClick={() => { resetAddTaskForm(); setShowAddTaskForm(null) }}>取消</button>
        <button className={styles.submitButton} disabled={!taskTitle.trim()} onClick={() => handleAddTask(phaseId)}>
          添加任务
        </button>
      </div>
    </div>
  )

  const renderPlanList = () => (
    <div className={styles.planList}>
      {plans.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📅</div>
          <div className={styles.emptyText}>还没有学习计划</div>
          <div className={styles.emptyHint}>创建考试复习计划，AI 帮你分阶段规划</div>
        </div>
      ) : (
        plans.map(plan => {
          const prog = getPlanProgress(plan)
          return (
            <div
              key={plan.id}
              className={`${styles.planCard} ${selectedPlanId === plan.id ? styles.planCardActive : ''}`}
              onClick={() => setSelectedPlanId(plan.id)}
            >
              <div className={styles.planCardHeader}>
                <div className={styles.planCardName}>{plan.name}</div>
                <button
                  className={styles.deletePlanButton}
                  onClick={e => { e.stopPropagation(); handleDeletePlan(plan.id) }}
                  title="删除计划"
                >🗑</button>
              </div>
              <div className={styles.planCardMeta}>
                <span className={styles.planCardDate}>📅 {plan.examDate}</span>
                <span className={styles.planCardDays}>
                  {prog.remainingDays > 0 ? `⏰ 剩余 ${prog.remainingDays} 天` : '✅ 已到考试日期'}
                </span>
              </div>
              <div className={styles.planCardTargets}>
                {plan.targetScores.map((s, i) => (
                  <span key={i} className={styles.targetTag}>{s.subject} {s.targetScore}/{s.totalScore}</span>
                ))}
              </div>
              <div className={styles.planCardProgressRow}>
                <div className={styles.progressBar}>
                  <div
                    className={`${styles.progressFill} ${formatProgressBar(prog.completionRate)}`}
                    style={{ width: `${Math.round(prog.completionRate * 100)}%` }}
                  />
                </div>
                <span className={styles.progressText}>{Math.round(prog.completionRate * 100)}%</span>
              </div>
              <div className={styles.planCardTaskCount}>
                {prog.completedTasks}/{prog.totalTasks} 任务完成 · {plan.phases.length} 个阶段
              </div>
            </div>
          )
        })
      )}
    </div>
  )

  const renderPhaseProgress = (prog: PlanProgress) => (
    <div className={styles.phaseProgressSection}>
      <div className={styles.sectionTitle}>阶段进度</div>
      {prog.phaseProgress.map(pp => (
        <div key={pp.phaseId} className={styles.phaseProgressItem}>
          <div className={styles.phaseProgressHeader}>
            <span className={styles.phaseProgressName}>{pp.phaseName}</span>
            <span className={styles.phaseProgressCount}>{pp.completed}/{pp.total}</span>
          </div>
          <div className={styles.miniProgressBar}>
            <div
              className={`${styles.miniProgressFill} ${formatProgressBar(pp.rate)}`}
              style={{ width: `${Math.round(pp.rate * 100)}%` }}
            />
          </div>
          <span className={styles.phaseProgressPct}>{Math.round(pp.rate * 100)}%</span>
        </div>
      ))}
    </div>
  )

  const renderTodayTasks = () => (
    <div className={styles.todaySection}>
      <div className={styles.sectionTitle}>今日任务</div>
      {todayTasks.length === 0 ? (
        <div className={styles.emptySmall}>当前阶段暂无任务</div>
      ) : (
        <div className={styles.todayTaskList}>
          {todayTasks.map(({ phaseName, task }) => (
            <div key={task.id} className={styles.todayTaskItem}>
              {editingTaskId === task.id ? (
                <div className={styles.taskEditInline}>
                  <input
                    className={styles.input}
                    type="text"
                    value={editTaskTitle}
                    onChange={e => setEditTaskTitle(e.target.value)}
                  />
                  <select
                    className={styles.select}
                    value={editTaskSubject}
                    onChange={e => setEditTaskSubject(e.target.value)}
                  >
                    {DEFAULT_SUBJECTS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <div className={styles.minutesField}>
                    <input
                      className={styles.input}
                      type="number"
                      min={5}
                      max={480}
                      value={editTaskMinutes}
                      onChange={e => setEditTaskMinutes(Math.max(5, Number(e.target.value) || 30))}
                    />
                    <span className={styles.minutesLabel}>分钟</span>
                  </div>
                  <button className={styles.saveEditButton} onClick={() => {
                    const phaseId = selectedPlan?.phases.find(p => p.tasks.some(t => t.id === task.id))?.id
                    if (phaseId) handleSaveEditTask(phaseId)
                  }}>保存</button>
                  <button className={styles.cancelEditButton} onClick={() => setEditingTaskId(null)}>取消</button>
                </div>
              ) : (
                <>
                  <div className={styles.todayTaskLeft}>
                    <button
                      className={`${styles.checkButton} ${task.completed ? styles.checkButtonDone : ''}`}
                      onClick={() => {
                        const phaseId = selectedPlan?.phases.find(p => p.tasks.some(t => t.id === task.id))?.id
                        if (phaseId) handleToggleTask(phaseId, task.id)
                      }}
                    >
                      {task.completed ? '✓' : '○'}
                    </button>
                    <div className={styles.todayTaskInfo}>
                      <div className={`${styles.todayTaskTitle} ${task.completed ? styles.taskCompleted : ''}`}>
                        {task.title}
                      </div>
                      <div className={styles.todayTaskMeta}>
                        <span className={styles.subjectBadge} style={{ background: `${getSubjectColor(task.subject)}20`, color: getSubjectColor(task.subject) }}>
                          {task.subject}
                        </span>
                        <span className={styles.phaseBadge}>{phaseName}</span>
                        <span className={styles.minutesBadge}>⏱ {task.estimatedMinutes}分钟</span>
                      </div>
                    </div>
                  </div>
                  <div className={styles.todayTaskActions}>
                    <button className={styles.editTaskButton} onClick={() => handleStartEditTask(task)}>✏️</button>
                    <button className={styles.deleteTaskButton} onClick={() => {
                      const phaseId = selectedPlan?.phases.find(p => p.tasks.some(t => t.id === task.id))?.id
                      if (phaseId) handleDeleteTask(phaseId, task.id)
                    }}>🗑</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const renderPlanDetail = () => {
    if (!selectedPlan || !progress) return null

    return (
      <div className={styles.detailPanel}>
        <div className={styles.detailHeader}>
          <div>
            <div className={styles.detailTitle}>{selectedPlan.name}</div>
            <div className={styles.detailMeta}>
              <span>📅 考试日期：{selectedPlan.examDate}</span>
              <span>⏰ 剩余 {progress.remainingDays} 天</span>
            </div>
            <div className={styles.detailTargets}>
              {selectedPlan.targetScores.map((s, i) => (
                <span key={i} className={styles.targetTag}>{s.subject} {s.targetScore}/{s.totalScore}</span>
              ))}
            </div>
          </div>
          <button className={styles.backButton} onClick={() => setSelectedPlanId(null)}>← 返回列表</button>
        </div>

        <div className={styles.overallProgress}>
          <div className={styles.overallLabel}>总进度</div>
          <div className={styles.overallBar}>
            <div
              className={`${styles.overallFill} ${formatProgressBar(progress.completionRate)}`}
              style={{ width: `${Math.round(progress.completionRate * 100)}%` }}
            />
          </div>
          <span className={styles.overallPct}>{Math.round(progress.completionRate * 100)}%</span>
          <span className={styles.overallCount}>({progress.completedTasks}/{progress.totalTasks})</span>
        </div>

        {progress.phaseProgress.length > 0 && renderPhaseProgress(progress)}

        {selectedPlan.aiDailySuggestion && (
          <div className={styles.aiSuggestionBox}>
            <div className={styles.aiSuggestionHeader}>
              <span>💡 AI 每日建议</span>
              <span className={styles.aiBadge}>AI</span>
            </div>
            <div className={styles.aiSuggestionContent}>{selectedPlan.aiDailySuggestion}</div>
          </div>
        )}

        <div className={styles.aiActions}>
          <button
            className={styles.aiButton}
            onClick={handleAIGeneratePlan}
            disabled={!canUseAI || aiLoading}
          >
            {aiLoading ? (
              <><span className={styles.spinner} /> 生成中...</>
            ) : (
              '🤖 AI 生成复习计划'
            )}
          </button>
          <button
            className={styles.aiButton}
            onClick={handleAIDailySuggestion}
            disabled={!canUseAI || aiSuggestionLoading || selectedPlan.phases.length === 0}
          >
            {aiSuggestionLoading ? (
              <><span className={styles.spinner} /> 分析中...</>
            ) : (
              '💡 获取今日学习建议'
            )}
          </button>
        </div>

        {!canUseAI && (
          <div className={styles.aiLocked}>
            🔒 AI 功能为会员专属，且需配置 API Key
          </div>
        )}

        {aiError && <div className={styles.error}>{aiError}</div>}
        {aiSuggestionError && <div className={styles.error}>{aiSuggestionError}</div>}

        {renderTodayTasks()}

        <div className={styles.phasesSection}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>学习阶段</span>
            <button className={styles.addButton} onClick={() => setShowAddPhaseForm(true)}>+ 添加阶段</button>
          </div>

          {selectedPlan.phases.length === 0 ? (
            <div className={styles.emptySmall}>暂无阶段，请手动添加或使用 AI 生成</div>
          ) : (
            selectedPlan.phases.map(phase => {
              const phaseProg = progress.phaseProgress.find(p => p.phaseId === phase.id)
              const isActive = (() => {
                const today = new Date().toISOString().slice(0, 10)
                return today >= phase.startDate && today <= phase.endDate
              })()

              return (
                <div key={phase.id} className={`${styles.phaseCard} ${isActive ? styles.phaseCardActive : ''}`}>
                  <div className={styles.phaseHeader}>
                    <div className={styles.phaseNameRow}>
                      <span className={styles.phaseName}>{phase.name}</span>
                      {isActive && <span className={styles.activeBadge}>进行中</span>}
                    </div>
                    <div className={styles.phaseActions}>
                      <button className={styles.deletePhaseButton} onClick={() => handleDeletePhase(phase.id)} title="删除阶段">🗑</button>
                    </div>
                  </div>
                  <div className={styles.phaseDates}>
                    {phase.startDate} ~ {phase.endDate}
                  </div>
                  {phaseProg && (
                    <div className={styles.phaseMiniProgress}>
                      <div className={styles.miniProgressBar}>
                        <div
                          className={`${styles.miniProgressFill} ${formatProgressBar(phaseProg.rate)}`}
                          style={{ width: `${Math.round(phaseProg.rate * 100)}%` }}
                        />
                      </div>
                      <span className={styles.miniProgressText}>{Math.round(phaseProg.rate * 100)}%</span>
                    </div>
                  )}

                  {phase.tasks.length === 0 ? (
                    <div className={styles.emptySmall}>暂无任务</div>
                  ) : (
                    <div className={styles.taskList}>
                      {phase.tasks.map(task => (
                        <div key={task.id} className={styles.taskItem}>
                          {editingTaskId === task.id ? (
                            <div className={styles.taskEditInlineCompact}>
                              <input
                                className={styles.input}
                                type="text"
                                value={editTaskTitle}
                                onChange={e => setEditTaskTitle(e.target.value)}
                              />
                              <div className={styles.taskEditActions}>
                                <button className={styles.saveEditButton} onClick={() => handleSaveEditTask(phase.id)}>保存</button>
                                <button className={styles.cancelEditButton} onClick={() => setEditingTaskId(null)}>取消</button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className={styles.taskLeft}>
                                <button
                                  className={`${styles.checkButton} ${task.completed ? styles.checkButtonDone : ''}`}
                                  onClick={() => handleToggleTask(phase.id, task.id)}
                                >
                                  {task.completed ? '✓' : '○'}
                                </button>
                                <div className={styles.taskInfo}>
                                  <div className={`${styles.taskTitle} ${task.completed ? styles.taskCompleted : ''}`}>
                                    {task.title}
                                  </div>
                                  <div className={styles.taskMeta}>
                                    <span className={styles.subjectBadge} style={{ background: `${getSubjectColor(task.subject)}20`, color: getSubjectColor(task.subject) }}>
                                      {task.subject}
                                    </span>
                                    <span className={styles.minutesBadge}>⏱ {task.estimatedMinutes}分钟</span>
                                  </div>
                                </div>
                              </div>
                              <div className={styles.taskActions}>
                                <button className={styles.editTaskButton} onClick={() => handleStartEditTask(task)}>✏️</button>
                                <button className={styles.deleteTaskButton} onClick={() => handleDeleteTask(phase.id, task.id)}>🗑</button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {showAddTaskForm === phase.id ? (
                    renderAddTaskForm(phase.id)
                  ) : (
                    <button className={styles.addTaskButton} onClick={() => {
                      resetAddTaskForm()
                      setShowAddTaskForm(phase.id)
                    }}>
                      + 添加任务
                    </button>
                  )}
                </div>
              )
            })
          )}

          {showAddPhaseForm && renderAddPhaseForm()}
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <div className={styles.title}>学习计划</div>
          <div className={styles.subtitle}>AI 驱动的备考规划，分阶段高效复习</div>
        </div>
        <button className={styles.createButton} onClick={() => {
          resetAddPlanForm()
          setShowAddPlanForm(true)
          setSelectedPlanId(null)
        }}>
          + 创建计划
        </button>
      </div>

      {showAddPlanForm && renderAddPlanForm()}

      {selectedPlan ? (
        renderPlanDetail()
      ) : (
        renderPlanList()
      )}
    </div>
  )
}