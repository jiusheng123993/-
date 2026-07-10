import { useCallback } from 'react'
import { CanvasCard } from '../../canvas/CanvasCard'
import { HabitTracker } from '../../../growth/habits/HabitTrackerUI'
import { JournalUI } from '../../../growth/journal/JournalUI'
import { ReadingUI } from '../../../growth/reading/ReadingUI'
import { ErrorBookUI } from '../../../growth/error-book/ErrorBookUI'
import { MemoryCardsUI } from '../../../growth/memory-cards/MemoryCardsUI'
import { ExamTrackerUI } from '../../../growth/exam-tracker/ExamTrackerUI'
import { StudyPlannerUI } from '../../../growth/study-planner/StudyPlannerUI'
import { FocusTimerUI } from '../../../growth/focus-timer/FocusTimerUI'
import { StudyCompanionUI } from '../../../growth/study-companion/StudyCompanionUI'
import { MoodJournalUI } from '../../../growth/mood-journal/MoodJournalUI'
import type { ModuleStoreState } from '../../module-store/types'
import type { StudyTheme } from '../../themes/themeRegistry'
import type { PersonaScenario } from '../../../ai-partner/personas/personaRegistry'
import type { WorkspaceState } from '../../data/workspaceStore'
import type { MemoryProfile } from '../../../ai-partner/memory/memoryTypes'

interface WorkbenchCanvasProps {
  moduleStoreState: ModuleStoreState
  activeTheme: StudyTheme
  activePersona: PersonaScenario
  activeTemplate: { title: string; operatingRhythm: string; defaultAction: string }
  promptDraft: { title: string }
  activeProvider: { name: string }
  workspaceState: WorkspaceState
  todoTasks: WorkspaceState['tasks']
  completedTasks: WorkspaceState['tasks']
  focusMinuteText: string
  focusSecondText: string
  focusDisplayTask: { id: string; title: string; dueLabel: string } | null
  focusRewardPoints: number
  focusTargetMinutes: number
  isFocusRunning: boolean
  activeFocusTask: { id: string; title: string } | null
  nextFocusTask: { id: string; title: string } | null
  focusPausedRemainingMs: number | null
  weeklyProgress: number
  memoryProfile: MemoryProfile
  userId: string
  FOCUS_MIN_MINUTES: number
  FOCUS_MAX_MINUTES: number
  FOCUS_STEP_MINUTES: number
  layoutImportError: string | null
  moveWorkbenchItem: (moduleId: string, position: { x: number; y: number }) => void
  removeCanvasModule: (moduleId: string) => void
  updateCanvasItems: (items: ModuleStoreState['activeModules']) => void
  setOpenWorkbenchDetail: (detail: string | null) => void
  setIsWallpaperPickerOpen: (open: boolean) => void
  setIsMemoryProfileOpen: (open: boolean) => void
  openThemePicker: () => void
  restorePersonaTheme: () => void
  startFocusTimer: () => void
  pauseFocusTimer: () => void
  resetFocusTimer: () => void
  adjustFocusDuration: (delta: number) => void
  handleFocusDurationInput: (e: React.ChangeEvent<HTMLInputElement>) => void
  setWorkspaceState: React.Dispatch<React.SetStateAction<WorkspaceState>>
  addToast: (toast: { type: string; title: string; message: string }) => void
}

export function WorkbenchCanvas({
  moduleStoreState,
  activeTheme,
  activePersona,
  activeTemplate,
  promptDraft,
  activeProvider,
  workspaceState,
  todoTasks,
  completedTasks,
  focusMinuteText,
  focusSecondText,
  focusDisplayTask,
  focusRewardPoints,
  _focusTargetMinutes,
  _isFocusRunning,
  _activeFocusTask,
  _nextFocusTask,
  _focusPausedRemainingMs,
  weeklyProgress,
  memoryProfile,
  userId,
  _FOCUS_MIN_MINUTES,
  _FOCUS_MAX_MINUTES,
  _FOCUS_STEP_MINUTES,
  layoutImportError,
  moveWorkbenchItem,
  removeCanvasModule,
  updateCanvasItems,
  setOpenWorkbenchDetail,
  _setIsWallpaperPickerOpen,
  _setIsMemoryProfileOpen,
  openThemePicker,
  restorePersonaTheme,
  _startFocusTimer,
  _pauseFocusTimer,
  _resetFocusTimer,
  _adjustFocusDuration,
  _handleFocusDurationInput,
  _setWorkspaceState,
  _addToast
}: WorkbenchCanvasProps) {

  const cardChildren: Record<string, React.ReactNode> = {
    'persona-plan': (
      <div className="canvas-thumb">
        <div className="canvas-thumb-title">{activeTemplate.title}</div>
        <div className="canvas-thumb-sub">{activeTemplate.operatingRhythm}</div>
        <div className="canvas-thumb-hint">{activeTemplate.defaultAction}</div>
      </div>
    ),
    'growth-rpg': (
      <div className="canvas-thumb">
        <div className="canvas-thumb-stat">
          <span className="canvas-thumb-value">Lv.{workspaceState.growth.level}</span>
          <span className="canvas-thumb-label">{workspaceState.growth.experience} 积分</span>
        </div>
        <div className="canvas-thumb-progress">
          <div className="canvas-thumb-bar" style={{ width: `${Math.min(100, workspaceState.growth.experience % 100)}%` }} />
        </div>
        <div className="canvas-thumb-sub">{workspaceState.growth.achievements} 个成就</div>
      </div>
    ),
    'key-metrics': (
      <div className="canvas-thumb">
        <div className="canvas-thumb-metrics">
          {activePersona.keyMetrics.slice(0, 3).map((metric, i) => (
            <div key={metric} className="canvas-thumb-metric">
              <span className="canvas-thumb-value">{i === 0 ? (activePersona.modules[0]?.signal ?? activePersona.mainModuleTitle) : `${70 + i * 6}%`}</span>
              <span className="canvas-thumb-label">{metric}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    'today-actions': (
      <div className="canvas-thumb">
        {todoTasks.length === 0 ? (
          <div className="canvas-thumb-empty">暂无待办任务</div>
        ) : (
          <div className="canvas-thumb-list">
            {todoTasks.slice(0, 3).map((task) => (
              <div key={task.id} className="canvas-thumb-item">
                <span className="canvas-thumb-dot" />
                <span className="canvas-thumb-text">{task.title}</span>
              </div>
            ))}
            {todoTasks.length > 3 && (
              <div className="canvas-thumb-more">+{todoTasks.length - 3} 更多</div>
            )}
          </div>
        )}
      </div>
    ),
    'focus-session': (
      <div className="canvas-thumb">
        <div className="canvas-thumb-stat">
          <span className="canvas-thumb-value canvas-thumb-timer">{focusMinuteText}:{focusSecondText}</span>
        </div>
        <div className="canvas-thumb-sub">{focusDisplayTask ? focusDisplayTask.title : '暂无专注任务'}</div>
        {focusDisplayTask && (
          <div className="canvas-thumb-hint">{focusDisplayTask.dueLabel} · {focusRewardPoints} 积分</div>
        )}
      </div>
    ),
    'focus-history': (
      <div className="canvas-thumb">
        {workspaceState.focusSessions.length === 0 ? (
          <div className="canvas-thumb-empty">暂无专注记录</div>
        ) : (
          <div className="canvas-thumb-list">
            {workspaceState.focusSessions.slice(0, 3).map((session) => (
              <div key={session.id} className="canvas-thumb-item">
                <span className="canvas-thumb-dot" />
                <span className="canvas-thumb-text">{session.taskTitle}</span>
                <span className="canvas-thumb-hint">{session.minutes}分钟</span>
              </div>
            ))}
          </div>
        )}
      </div>
    ),
    'memory-insights': (
      <div className="canvas-thumb">
        {workspaceState.focusSessions.length === 0 ? (
          <div className="canvas-thumb-empty">暂无记忆记录</div>
        ) : (
          <div className="canvas-thumb-list">
            {workspaceState.focusSessions.slice(0, 3).map((session) => (
              <div key={session.id} className="canvas-thumb-item">
                <span className="canvas-thumb-dot" />
                <span className="canvas-thumb-text">完成 {session.minutes}分钟：{session.taskTitle}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    ),
    'ai-coach': (
      <div className="canvas-thumb">
        <div className="canvas-thumb-title">{activePersona.aiRole}</div>
        <div className="canvas-thumb-sub">{promptDraft.title}</div>
        <div className="canvas-thumb-hint">{activeProvider.name} · {workspaceState.integrations.ai.status === 'ready' ? '已就绪' : '待配置'}</div>
      </div>
    ),
    'platform-matrix': (
      <div className="canvas-thumb">
        <div className="canvas-thumb-sub">桌面端优先，数据层已按本地优先设计</div>
        <div className="canvas-thumb-tags">
          <span>Desktop</span>
          <span>微信小程序</span>
          <span>Web/PWA</span>
          <span>iOS</span>
          <span>HarmonyOS</span>
        </div>
      </div>
    ),
    'theme-center': (
      <div className="canvas-thumb">
        <div className="canvas-thumb-title">{activeTheme.name}</div>
        <div className="canvas-thumb-sub">{activeTheme.design.tone}</div>
        <div className="canvas-thumb-swatches">
          <span style={{ background: activeTheme.tokens.colors.primary }} />
          <span style={{ background: activeTheme.tokens.colors.secondary }} />
          <span style={{ background: activeTheme.tokens.colors.accent }} />
        </div>
        <div className="canvas-thumb-actions">
          <button type="button" onClick={(event) => { event.stopPropagation(); openThemePicker() }}>主题切换</button>
          {workspaceState.preferences.themeMode === 'manual' && (
            <button type="button" onClick={(event) => { event.stopPropagation(); restorePersonaTheme() }}>恢复场景推荐主题</button>
          )}
        </div>
      </div>
    ),
    'statistics': (
      <div className="canvas-thumb">
        <div className="canvas-thumb-metrics">
          <div className="canvas-thumb-metric">
            <span className="canvas-thumb-value">{completedTasks.length}</span>
            <span className="canvas-thumb-label">已完成</span>
          </div>
          <div className="canvas-thumb-metric">
            <span className="canvas-thumb-value">{todoTasks.length}</span>
            <span className="canvas-thumb-label">待办</span>
          </div>
          <div className="canvas-thumb-metric">
            <span className="canvas-thumb-value">{workspaceState.focusSessions.reduce((sum, s) => sum + s.minutes, 0)}</span>
            <span className="canvas-thumb-label">专注分钟</span>
          </div>
          <div className="canvas-thumb-metric">
            <span className="canvas-thumb-value">{workspaceState.growth.streakDays}</span>
            <span className="canvas-thumb-label">连续天数</span>
          </div>
        </div>
        <div className="canvas-thumb-progress">
          <div className="canvas-thumb-bar" style={{ width: `${weeklyProgress}%` }} />
        </div>
      </div>
    ),
    'cycle-today': (
      <div className="canvas-thumb">
        <div className="canvas-thumb-title">当前阶段</div>
        <div className="canvas-thumb-sub">查看今日周期阶段和能量建议</div>
        <div className="canvas-thumb-metrics">
          <div className="canvas-thumb-metric">
            <span className="canvas-thumb-value">--</span>
            <span className="canvas-thumb-label">周期天数</span>
          </div>
          <div className="canvas-thumb-metric">
            <span className="canvas-thumb-value">--</span>
            <span className="canvas-thumb-label">能量等级</span>
          </div>
        </div>
      </div>
    ),
    'memory-profile': (
      <div className="canvas-thumb">
        <div className="canvas-thumb-title">
          记忆画像
          <span className="canvas-thumb-badge">
            {memoryProfile.personality.mbtiTendency && memoryProfile.personality.mbtiTendency !== 'unknown' ? memoryProfile.personality.mbtiTendency : '未设置'}
          </span>
        </div>
        {memoryProfile.personality.traits.length > 0 ? (
          <div className="canvas-thumb-tags">
            {memoryProfile.personality.traits.slice(0, 3).map((trait) => (
              <span key={trait}>{trait}</span>
            ))}
          </div>
        ) : (
          <div className="canvas-thumb-empty">点击完善记忆画像</div>
        )}
        <div className="canvas-thumb-hint">
          节奏：{memoryProfile.rhythm.energyPeak === 'morning' ? '晨间型' : memoryProfile.rhythm.energyPeak === 'afternoon' ? '午后型' : memoryProfile.rhythm.energyPeak === 'evening' ? '晚间型' : '未设置'}
          {' · '}
          学习：{memoryProfile.learning.learningStyle === 'visual' ? '视觉型' : memoryProfile.learning.learningStyle === 'auditory' ? '听觉型' : memoryProfile.learning.learningStyle === 'kinesthetic' ? '动觉型' : '未设置'}
        </div>
      </div>
    ),
    'habit-tracker': (
      <div className="canvas-thumb">
        <HabitTracker compact />
      </div>
    ),
    'journal': (
      <div className="canvas-thumb">
        <JournalUI compact />
      </div>
    ),
    'reading-list': (
      <div className="canvas-thumb">
        <ReadingUI compact theme={activeTheme} />
      </div>
    ),
    'error-book': (
      <div className="canvas-thumb">
        <ErrorBookUI userId={userId} />
      </div>
    ),
    'memory-cards': (
      <div className="canvas-thumb">
        <MemoryCardsUI />
      </div>
    ),
    'exam-tracker': (
      <div className="canvas-thumb">
        <ExamTrackerUI userId={userId} />
      </div>
    ),
    'study-planner': (
      <div className="canvas-thumb">
        <StudyPlannerUI userId={userId} />
      </div>
    ),
    'focus-timer': (
      <div className="canvas-thumb">
        <FocusTimerUI userId={userId} />
      </div>
    ),
    'study-companion': (
      <div className="canvas-thumb">
        <StudyCompanionUI userId={userId} />
      </div>
    ),
    'mood-journal': (
      <div className="canvas-thumb">
        <MoodJournalUI userId={userId} />
      </div>
    )
  }

  const personaTitleMap: Record<string, string> = {
    'persona-plan': activePersona.mainModuleTitle,
    'ai-coach': activePersona.aiRole
  }

  const checkCollision = useCallback((_moduleId: string, targetPos: { x: number; y: number }, item: ModuleStoreState['activeModules'][number]) => {
    const hasCollision = moduleStoreState.activeModules.some((other) => {
      if (other.moduleId === item.moduleId) return false
      const otherRight = other.position.x + other.size.columns
      const otherBottom = other.position.y + other.size.rows
      const targetRight = targetPos.x + item.size.columns
      const targetBottom = targetPos.y + item.size.rows
      return targetPos.x < otherRight && targetRight > other.position.x && targetPos.y < otherBottom && targetBottom > other.position.y
    })
    if (!hasCollision) {
      moveWorkbenchItem(item.moduleId, targetPos)
    }
  }, [moduleStoreState.activeModules, moveWorkbenchItem])

  return (
    <section className="panel" aria-label="工作台">
      <div className="card-heading">
        <div>
          <h2>工作台</h2>
        </div>
      </div>
      <div className="draggable-canvas workbench-canvas" role="region" aria-label="工作台画布">
        {moduleStoreState.activeModules.map((item) => {
          const module = moduleStoreState.availableModules.find((candidate) => candidate.id === item.moduleId)
          if (!module) return null

          return (
            <CanvasCard
              key={item.moduleId}
              title={personaTitleMap[item.moduleId] || module.title}
              description={module.description}
              size={item.size}
              position={item.position}
              onDragStart={() => undefined}
              onDragEnd={() => undefined}
              onMove={(position) => moveWorkbenchItem(item.moduleId, position)}
              onRemove={() => removeCanvasModule(item.moduleId)}
              onResize={(size) => updateCanvasItems(moduleStoreState.activeModules.map((candidate) => (
                candidate.moduleId === item.moduleId ? { ...candidate, size } : candidate
              )))}
              onOpenDetails={() => setOpenWorkbenchDetail(item.moduleId)}
              collisionEnabled={true}
              onCollision={(moduleId, targetPos) => checkCollision(moduleId, targetPos, item)}
            >
              {cardChildren[item.moduleId]}
            </CanvasCard>
          )
        })}
      </div>
      {layoutImportError && <small style={{ color: '#dc2626' }}>{layoutImportError}</small>}
    </section>
  )
}
