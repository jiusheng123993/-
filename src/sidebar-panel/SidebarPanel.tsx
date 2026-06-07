import { useState, useCallback } from 'react'
import type { SidebarPanelModuleId } from './types'
import { SIDEBAR_PANEL_MODULES, loadSidebarPanelState, saveSidebarPanelState } from './sidebarPanelStore'
import { SidebarPanelModuleRenderer } from './SidebarPanelModuleRenderer'
import styles from './SidebarPanel.module.css'

interface SidebarPanelProps {
  personaId: string
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
  onOpenSchedule?: () => void
}

export function SidebarPanel({
  personaId,
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
  onOpenSchedule
}: SidebarPanelProps) {
  const [activeIds, setActiveIds] = useState<SidebarPanelModuleId[]>(() =>
    loadSidebarPanelState(personaId)
  )
  const [showSelector, setShowSelector] = useState(false)

  const addModule = useCallback((moduleId: SidebarPanelModuleId) => {
    setActiveIds((prev) => {
      const next = [...prev, moduleId]
      saveSidebarPanelState(personaId, next)
      return next
    })
    setShowSelector(false)
  }, [personaId])

  const removeModule = useCallback((moduleId: SidebarPanelModuleId) => {
    setActiveIds((prev) => {
      const next = prev.filter((id) => id !== moduleId)
      saveSidebarPanelState(personaId, next)
      return next
    })
  }, [personaId])

  const availableToAdd = SIDEBAR_PANEL_MODULES.filter(
    (m) => !activeIds.includes(m.id) && m.personaIds.includes(personaId)
  )

  return (
    <aside className={styles.sidebarPanel}>
      <div className={styles.sidebarPanelHeader}>
        <span className={styles.sidebarPanelTitle}>快捷面板</span>
        <button
          className={styles.sidebarPanelAddBtn}
          onClick={() => setShowSelector(!showSelector)}
          title="添加模块"
          type="button"
        >
          +
        </button>
      </div>

      {showSelector && availableToAdd.length > 0 && (
        <div className={styles.sidebarPanelSelector}>
          {availableToAdd.map((mod) => (
            <button
              key={mod.id}
              className={styles.sidebarPanelSelectorItem}
              onClick={() => addModule(mod.id)}
              type="button"
            >
              <span className={styles.sidebarPanelSelectorIcon}>{mod.icon}</span>
              <span>{mod.title}</span>
            </button>
          ))}
        </div>
      )}

      <div className={styles.sidebarPanelModules}>
        {activeIds.map((moduleId) => (
          <SidebarPanelModuleRenderer
            key={moduleId}
            moduleId={moduleId}
            streakDays={streakDays}
            totalFocusMinutes={totalFocusMinutes}
            completedTasks={completedTasks}
            todoTasks={todoTasks}
            focusMinuteText={focusMinuteText}
            focusSecondText={focusSecondText}
            isFocusRunning={isFocusRunning}
            focusDisplayTask={focusDisplayTask}
            focusTargetMinutes={focusTargetMinutes}
            onStartFocus={onStartFocus}
            onPauseFocus={onPauseFocus}
            onResetFocus={onResetFocus}
            onAdjustFocus={onAdjustFocus}
            onOpenSchedule={onOpenSchedule}
            onRemove={() => removeModule(moduleId)}
          />
        ))}
      </div>
    </aside>
  )
}
