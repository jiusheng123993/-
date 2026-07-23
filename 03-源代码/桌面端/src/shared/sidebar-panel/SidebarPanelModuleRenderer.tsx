import type { SidebarPanelModuleId } from './types'
import { FocusDashboard } from './modules/FocusDashboard'
import { DailyPulse } from './modules/DailyPulse'
import { HabitsModule } from './modules/HabitsModule'
import { QuickNotesModule } from './modules/QuickNotesModule'
import { DailyQuote } from './modules/DailyQuote'

interface SidebarPanelModuleRendererProps {
  moduleId: SidebarPanelModuleId
  streakDays: number
  totalFocusMinutes: number
  completedTasks: number
  todoTasks: { id: string; title: string; dueLabel: string; minutes: number }[]
  focusMinuteText: string
  focusSecondText: string
  isFocusRunning: boolean
  focusDisplayTask: { id: string; title: string; dueLabel: string } | null
  focusTargetMinutes: number
  onStartFocus: () => void
  onPauseFocus: () => void
  onResetFocus: () => void
  onAdjustFocus: (delta: number) => void
  onRemove: () => void
}

export function SidebarPanelModuleRenderer({
  moduleId,
  streakDays,
  totalFocusMinutes,
  completedTasks,
  todoTasks,
  focusMinuteText,
  focusSecondText,
  isFocusRunning,
  focusDisplayTask,
  focusTargetMinutes,
  onStartFocus,
  onPauseFocus,
  onResetFocus,
  onAdjustFocus,
  onRemove
}: SidebarPanelModuleRendererProps) {
  switch (moduleId) {
    case 'side-focus-dashboard':
      return (
        <FocusDashboard
          focusMinuteText={focusMinuteText}
          focusSecondText={focusSecondText}
          isFocusRunning={isFocusRunning}
          focusDisplayTask={focusDisplayTask}
          focusTargetMinutes={focusTargetMinutes}
          totalFocusMinutes={totalFocusMinutes}
          onStartFocus={onStartFocus}
          onPauseFocus={onPauseFocus}
          onResetFocus={onResetFocus}
          onAdjustFocus={onAdjustFocus}
          onRemove={onRemove}
        />
      )

    case 'side-daily-pulse':
      return (
        <DailyPulse
          streakDays={streakDays}
          completedTasks={completedTasks}
          totalFocusMinutes={totalFocusMinutes}
          todoTasks={todoTasks}
          onRemove={onRemove}
        />
      )

    case 'side-habits':
      return (
        <HabitsModule
          onRemove={onRemove}
        />
      )

    case 'side-quick-notes':
      return (
        <QuickNotesModule
          onRemove={onRemove}
        />
      )

    case 'side-daily-quote':
      return (
        <DailyQuote
          onRemove={onRemove}
        />
      )

    default:
      return (
        <div style={{
          border: '1px solid var(--border)',
          borderRadius: '16px',
          background: 'var(--surface)',
          padding: '16px',
          textAlign: 'center',
          color: 'var(--muted)',
          fontSize: '12px'
        }}>
          <div style={{ marginBottom: '8px', fontSize: '24px' }}>🚧</div>
          <div>模块开发中</div>
          <button
            onClick={onRemove}
            type="button"
            style={{
              marginTop: '8px',
              padding: '4px 12px',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              background: 'transparent',
              color: 'var(--muted)',
              cursor: 'pointer',
              fontSize: '11px'
            }}
          >
            移除
          </button>
        </div>
      )
  }
}
