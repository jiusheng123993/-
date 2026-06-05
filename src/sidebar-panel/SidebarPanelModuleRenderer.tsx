import type { SidebarPanelModuleId } from './types'
import { getDailyQuote } from '../quotes/dailyQuote'
import styles from './SidebarPanel.module.css'

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
    case 'side-pomodoro':
      return (
        <div className={styles.moduleCard}>
          <div className={styles.moduleHeader}>
            <span>⏱️ 番茄钟</span>
            <button className={styles.moduleRemoveBtn} onClick={onRemove} type="button" title="移除">×</button>
          </div>
          <div className={styles.pomodoroTimer}>
            <span className={styles.pomodoroTime}>{focusMinuteText}:{focusSecondText}</span>
          </div>
          {focusDisplayTask && (
            <div className={styles.pomodoroTask}>{focusDisplayTask.title}</div>
          )}
          {!isFocusRunning && (
            <div className={styles.pomodoroDurationAdjust}>
              <button
                className={styles.pomodoroAdjustBtn}
                onClick={() => onAdjustFocus(-5)}
                type="button"
                title="减少5分钟"
                disabled={focusTargetMinutes <= 5}
              >
                −5
              </button>
              <span className={styles.pomodoroDurationLabel}>{focusTargetMinutes} 分钟</span>
              <button
                className={styles.pomodoroAdjustBtn}
                onClick={() => onAdjustFocus(5)}
                type="button"
                title="增加5分钟"
                disabled={focusTargetMinutes >= 180}
              >
                +5
              </button>
            </div>
          )}
          <div className={styles.pomodoroActions}>
            <button
              className={styles.pomodoroBtn}
              onClick={isFocusRunning ? onPauseFocus : onStartFocus}
              type="button"
            >
              {isFocusRunning ? '暂停' : '开始'}
            </button>
            <button
              className={styles.pomodoroBtnSecondary}
              onClick={onResetFocus}
              type="button"
            >
              重置
            </button>
          </div>
        </div>
      )

    case 'side-todo':
      return (
        <div className={styles.moduleCard}>
          <div className={styles.moduleHeader}>
            <span>📝 今日待办</span>
            <button className={styles.moduleRemoveBtn} onClick={onRemove} type="button" title="移除">×</button>
          </div>
          <div className={styles.todoList}>
            {todoTasks.length === 0 ? (
              <div className={styles.emptyHint}>暂无待办</div>
            ) : (
              todoTasks.slice(0, 5).map((task) => (
                <div key={task.id} className={styles.todoItem}>
                  <span className={styles.todoCheckbox}>☐</span>
                  <div className={styles.todoContent}>
                    <span className={styles.todoTitle}>{task.title}</span>
                    <span className={styles.todoMeta}>{task.minutes} 分钟</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )

    case 'side-streak':
      return (
        <div className={styles.moduleCard}>
          <div className={styles.moduleHeader}>
            <span>📊 今日数据</span>
            <button className={styles.moduleRemoveBtn} onClick={onRemove} type="button" title="移除">×</button>
          </div>
          <div className={styles.streakContent}>
            <div className={styles.streakRow}>
              <span className={styles.streakLabel}>专注</span>
              <span className={styles.streakValue}>{totalFocusMinutes} 分钟</span>
            </div>
            <div className={styles.streakRow}>
              <span className={styles.streakLabel}>完成</span>
              <span className={styles.streakValue}>{completedTasks} 项</span>
            </div>
            <div className={styles.streakRow}>
              <span className={styles.streakLabel}>已坚持</span>
              <span className={styles.streakValue}>{streakDays} 天</span>
            </div>
          </div>
        </div>
      )

    case 'side-countdown':
      return (
        <div className={styles.moduleCard}>
          <div className={styles.moduleHeader}>
            <span>📅 考试倒计时</span>
            <button className={styles.moduleRemoveBtn} onClick={onRemove} type="button" title="移除">×</button>
          </div>
          <div className={styles.countdownContent}>
            <span className={styles.countdownDays}>--</span>
            <span className={styles.countdownLabel}>天后考试</span>
            <span className={styles.countdownHint}>请在设置中配置考试日期</span>
          </div>
        </div>
      )

    case 'side-subject-progress':
      return (
        <div className={styles.moduleCard}>
          <div className={styles.moduleHeader}>
            <span>📚 科目进度</span>
            <button className={styles.moduleRemoveBtn} onClick={onRemove} type="button" title="移除">×</button>
          </div>
          <div className={styles.subjectContent}>
            <div className={styles.emptyHint}>暂无科目数据</div>
          </div>
        </div>
      )

    case 'side-meeting-actions':
      return (
        <div className={styles.moduleCard}>
          <div className={styles.moduleHeader}>
            <span>💼 会议行动项</span>
            <button className={styles.moduleRemoveBtn} onClick={onRemove} type="button" title="移除">×</button>
          </div>
          <div className={styles.subjectContent}>
            <div className={styles.emptyHint}>暂无行动项</div>
          </div>
        </div>
      )

    case 'side-weekly-materials':
      return (
        <div className={styles.moduleCard}>
          <div className={styles.moduleHeader}>
            <span>📋 周报素材</span>
            <button className={styles.moduleRemoveBtn} onClick={onRemove} type="button" title="移除">×</button>
          </div>
          <div className={styles.streakContent}>
            <div className={styles.streakRow}>
              <span className={styles.streakLabel}>本周专注</span>
              <span className={styles.streakValue}>{totalFocusMinutes} 分钟</span>
            </div>
            <div className={styles.streakRow}>
              <span className={styles.streakLabel}>完成任务</span>
              <span className={styles.streakValue}>{completedTasks} 项</span>
            </div>
          </div>
        </div>
      )

    case 'side-idea-inbox':
      return (
        <div className={styles.moduleCard}>
          <div className={styles.moduleHeader}>
            <span>💡 灵感速记</span>
            <button className={styles.moduleRemoveBtn} onClick={onRemove} type="button" title="移除">×</button>
          </div>
          <div className={styles.subjectContent}>
            <textarea
              className={styles.ideaInput}
              placeholder="记录一闪而过的灵感..."
              rows={3}
            />
          </div>
        </div>
      )

    case 'side-publish-calendar':
      return (
        <div className={styles.moduleCard}>
          <div className={styles.moduleHeader}>
            <span>📆 发布日历</span>
            <button className={styles.moduleRemoveBtn} onClick={onRemove} type="button" title="移除">×</button>
          </div>
          <div className={styles.subjectContent}>
            <div className={styles.emptyHint}>暂无发布计划</div>
          </div>
        </div>
      )

    case 'side-habits':
      return (
        <div className={styles.moduleCard}>
          <div className={styles.moduleHeader}>
            <span>✅ 今日习惯</span>
            <button className={styles.moduleRemoveBtn} onClick={onRemove} type="button" title="移除">×</button>
          </div>
          <div className={styles.subjectContent}>
            <div className={styles.emptyHint}>暂无习惯数据</div>
          </div>
        </div>
      )

    case 'side-mood':
      return (
        <div className={styles.moduleCard}>
          <div className={styles.moduleHeader}>
            <span>😊 心情打卡</span>
            <button className={styles.moduleRemoveBtn} onClick={onRemove} type="button" title="移除">×</button>
          </div>
          <div className={styles.moodContent}>
            <div className={styles.moodEmojis}>
              {['😄', '🙂', '😐', '😕', '😢'].map((emoji) => (
                <button key={emoji} className={styles.moodEmoji} type="button">{emoji}</button>
              ))}
            </div>
          </div>
        </div>
      )

    case 'side-daily-quote': {
      const quote = getDailyQuote()
      return (
        <div className={styles.moduleCard}>
          <div className={styles.moduleHeader}>
            <span>💬 每日一句</span>
            <button className={styles.moduleRemoveBtn} onClick={onRemove} type="button" title="移除">×</button>
          </div>
          <div className={styles.quoteContent}>
            <p className={styles.quoteText}>"{quote.content}"</p>
            <span className={styles.quoteAuthor}>—— {quote.author}</span>
          </div>
        </div>
      )
    }

    default:
      return null
  }
}