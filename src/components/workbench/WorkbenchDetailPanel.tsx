import { AdaptiveModal } from '../../platforms/AdaptiveModal'
import { HabitTracker } from '../../habits/HabitTrackerUI'
import { JournalUI } from '../../journal/JournalUI'
import { ReadingUI } from '../../reading/ReadingUI'
import { ErrorBookUI } from '../../error-book/ErrorBookUI'
import { MemoryCardsUI } from '../../memory-cards/MemoryCardsUI'
import { ExamTrackerUI } from '../../exam-tracker/ExamTrackerUI'
import { StudyPlannerUI } from '../../study-planner/StudyPlannerUI'
import { FocusTimerUI } from '../../focus-timer/FocusTimerUI'
import { StudyCompanionUI } from '../../study-companion/StudyCompanionUI'
import { MoodJournalUI } from '../../mood-journal/MoodJournalUI'
import type { StudyTheme } from '../../themes/themeRegistry'
import type { PersonaScenario } from '../../personas/personaRegistry'
import type { WorkspaceState } from '../../data/workspaceStore'
import type { MemoryProfile } from '../../memory/memoryTypes'

export interface WorkbenchDetailPanelProps {
  detail: string | null
  onClose: () => void
  activeTheme: StudyTheme
  userId: string
  activePersona: PersonaScenario
  workspaceState: WorkspaceState
  todoTasks: WorkspaceState['tasks']
  completedTasks: WorkspaceState['tasks']
  focusMinuteText: string
  focusSecondText: string
  focusDisplayTask: { id: string; title: string; dueLabel: string } | null
  focusRewardPoints: number
  weeklyProgress: number
  memoryProfile: MemoryProfile
  onOpenCycleTracker: () => void
  onOpenMemoryProfile: () => void
}

const PLATFORMS = ['Desktop', '微信小程序', 'Web/PWA', 'iOS', 'HarmonyOS']

export function WorkbenchDetailPanel({
  detail,
  onClose,
  activeTheme,
  userId,
  activePersona,
  workspaceState,
  todoTasks,
  completedTasks,
  focusMinuteText,
  focusSecondText,
  focusDisplayTask,
  focusRewardPoints,
  weeklyProgress,
  memoryProfile,
  onOpenCycleTracker,
  onOpenMemoryProfile
}: WorkbenchDetailPanelProps) {
  return (
    <>
      <AdaptiveModal
        isOpen={detail === 'habit-tracker'}
        onClose={onClose}
        title="习惯追踪"
        subtitle="坚持每日打卡，养成好习惯"
        ariaLabel="习惯追踪 · 工作台详情"
        className="habit-tracker-detail-modal"
      >
        <div className="membership-modal-content">
          <HabitTracker />
        </div>
      </AdaptiveModal>

      <AdaptiveModal
        isOpen={detail === 'journal'}
        onClose={onClose}
        title="复盘日记"
        subtitle="记录每日收获、反思和心情"
        ariaLabel="复盘日记 · 工作台详情"
        className="journal-detail-modal"
      >
        <div className="membership-modal-content">
          <JournalUI />
        </div>
      </AdaptiveModal>

      <AdaptiveModal
        isOpen={detail === 'reading-list'}
        onClose={onClose}
        title="阅读清单"
        subtitle="书籍管理、阅读进度追踪、读书笔记"
        ariaLabel="阅读清单 · 工作台详情"
        className="reading-list-detail-modal"
      >
        <div className="membership-modal-content">
          <ReadingUI theme={activeTheme} />
        </div>
      </AdaptiveModal>

      <AdaptiveModal
        isOpen={detail === 'error-book'}
        onClose={onClose}
        title="错题本"
        subtitle="记录错题，AI 智能分析"
        ariaLabel="错题本 · 工作台详情"
        className="error-book-detail-modal"
      >
        <div className="membership-modal-content">
          <ErrorBookUI userId={userId} />
        </div>
      </AdaptiveModal>

      <AdaptiveModal
        isOpen={detail === 'memory-cards'}
        onClose={onClose}
        title="记忆卡"
        subtitle="间隔重复记忆，AI 自动提取知识点"
        ariaLabel="记忆卡 · 工作台详情"
        className="memory-cards-detail-modal"
      >
        <div className="membership-modal-content">
          <MemoryCardsUI />
        </div>
      </AdaptiveModal>

      <AdaptiveModal
        isOpen={detail === 'exam-tracker'}
        onClose={onClose}
        title="考试记录"
        subtitle="记录每次考试各科分数，AI 对比分析进退步"
        ariaLabel="考试记录 · 工作台详情"
        className="exam-tracker-detail-modal"
      >
        <div className="membership-modal-content">
          <ExamTrackerUI userId={userId} />
        </div>
      </AdaptiveModal>

      <AdaptiveModal
        isOpen={detail === 'study-planner'}
        onClose={onClose}
        title="学习计划"
        subtitle="AI 驱动的备考规划，分阶段高效复习"
        ariaLabel="学习计划 · 工作台详情"
        className="study-planner-detail-modal"
      >
        <div className="membership-modal-content">
          <StudyPlannerUI userId={userId} />
        </div>
      </AdaptiveModal>

      <AdaptiveModal
        isOpen={detail === 'focus-timer'}
        onClose={onClose}
        title="专注计时"
        subtitle="专注数据看板，科目分布统计，专注趋势追踪"
        ariaLabel="专注计时 · 工作台详情"
        className="focus-timer-detail-modal"
      >
        <div className="membership-modal-content">
          <FocusTimerUI userId={userId} />
        </div>
      </AdaptiveModal>

      <AdaptiveModal
        isOpen={detail === 'study-companion'}
        onClose={onClose}
        title="备考陪伴"
        subtitle="AI 备考陪伴伙伴，情绪支持、呼吸放松、正念练习"
        ariaLabel="备考陪伴 · 工作台详情"
        className="study-companion-detail-modal"
      >
        <div className="membership-modal-content">
          <StudyCompanionUI userId={userId} />
        </div>
      </AdaptiveModal>

      <AdaptiveModal
        isOpen={detail === 'mood-journal'}
        onClose={onClose}
        title="情绪日记"
        subtitle="每日情绪记录，趋势追踪，低情绪预警关怀"
        ariaLabel="情绪日记 · 工作台详情"
        className="mood-journal-detail-modal"
      >
        <div className="membership-modal-content">
          <MoodJournalUI userId={userId} />
        </div>
      </AdaptiveModal>

      <AdaptiveModal
        isOpen={detail === 'focus-history'}
        onClose={onClose}
        title="最近专注"
        subtitle={`${workspaceState.focusSessions.length} 次专注记录`}
        ariaLabel="最近专注 · 工作台详情"
      >
        <div className="focus-history-detail">
          {workspaceState.focusSessions.length === 0 ? (
            <p className="empty-state">完成首个任务后，会自动沉淀到这里。</p>
          ) : (
            <ul className="focus-history-detail-list">
              {workspaceState.focusSessions.map((session) => (
                <li key={session.id} className="focus-history-detail-item">
                  <div className="focus-history-detail-main">
                    <strong>{session.taskTitle}</strong>
                    <span className="focus-history-detail-meta">
                      {session.minutes} 分钟 · {session.rewardPoints} 积分
                    </span>
                  </div>
                  <span className="focus-history-detail-time">
                    {new Date(session.completedAt).toLocaleString('zh-CN', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="focus-history-summary">
            <article>
              <strong>{workspaceState.focusSessions.reduce((sum, s) => sum + s.minutes, 0)}</strong>
              <span>累计分钟</span>
            </article>
            <article>
              <strong>{workspaceState.focusSessions.length}</strong>
              <span>专注次数</span>
            </article>
            <article>
              <strong>{workspaceState.focusSessions.reduce((sum, s) => sum + s.rewardPoints, 0)}</strong>
              <span>累计积分</span>
            </article>
          </div>
        </div>
      </AdaptiveModal>

      <AdaptiveModal
        isOpen={detail === 'persona-plan'}
        onClose={onClose}
        title={activePersona.mainModuleTitle}
        subtitle={activePersona.description}
        ariaLabel={`${activePersona.mainModuleTitle} · 工作台详情`}
      >
        <div className="membership-modal-content">
          <p style={{ padding: 20, color: 'var(--muted)' }}>该模块为当前场景的核心展示区域，详细内容请在画布模块中查看。</p>
        </div>
      </AdaptiveModal>

      <AdaptiveModal
        isOpen={detail === 'growth-rpg'}
        onClose={onClose}
        title="成长等级"
        subtitle={`Lv. ${workspaceState.growth.level} · ${workspaceState.growth.experience} 积分`}
        ariaLabel="成长等级 · 工作台详情"
      >
        <div className="membership-modal-content">
          <section style={{ padding: 20 }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: 'var(--primary)', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px', fontSize: 32, fontWeight: 700
              }}>
                {workspaceState.growth.level}
              </div>
              <h2 style={{ fontSize: 32, fontWeight: 700, margin: 0 }}>Lv. {workspaceState.growth.level}</h2>
              <p style={{ color: 'var(--muted)', margin: '8px 0 16px' }}>{workspaceState.growth.experience} 积分</p>
              <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, (workspaceState.growth.experience % 1000) / 10)}%`, height: '100%', background: 'var(--primary)', borderRadius: 4 }} />
              </div>
              <p style={{ fontSize: 12, color: 'var(--muted)', margin: '8px 0 0' }}>{1000 - (workspaceState.growth.experience % 1000)} 积分到下一级</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, textAlign: 'center' }}>
              <div style={{ padding: 16, background: 'var(--surface-elevated)', borderRadius: 12 }}>
                <strong style={{ fontSize: 24 }}>{workspaceState.growth.achievements}</strong>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--muted)' }}>成就</p>
              </div>
              <div style={{ padding: 16, background: 'var(--surface-elevated)', borderRadius: 12 }}>
                <strong style={{ fontSize: 24 }}>{workspaceState.growth.streakDays}</strong>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--muted)' }}>连续天数</p>
              </div>
              <div style={{ padding: 16, background: 'var(--surface-elevated)', borderRadius: 12 }}>
                <strong style={{ fontSize: 24 }}>{workspaceState.growth.totalFocusMinutes}</strong>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--muted)' }}>专注分钟</p>
              </div>
            </div>
          </section>
        </div>
      </AdaptiveModal>

      <AdaptiveModal
        isOpen={detail === 'key-metrics'}
        onClose={onClose}
        title="关键指标"
        subtitle="当前场景的关键指标展示"
        ariaLabel="关键指标 · 工作台详情"
      >
        <div className="membership-modal-content">
          <div style={{ padding: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              {activePersona.keyMetrics.map((metric, index) => (
                <div key={metric} style={{ padding: 16, background: 'var(--surface-elevated)', borderRadius: 12, textAlign: 'center' }}>
                  <strong style={{ fontSize: 20, color: 'var(--primary)' }}>{index === 0 ? (activePersona.modules[0]?.signal ?? activePersona.mainModuleTitle) : `${70 + index * 6}%`}</strong>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--muted)' }}>{metric}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AdaptiveModal>

      <AdaptiveModal
        isOpen={detail === 'today-actions'}
        onClose={onClose}
        title="今日行动"
        subtitle={`${todoTasks.length} 个待办 · ${completedTasks.length} 已完成`}
        ariaLabel="今日行动 · 工作台详情"
      >
        <div className="membership-modal-content">
          <div style={{ padding: 20, maxHeight: 400, overflow: 'auto' }}>
            {todoTasks.length === 0 && completedTasks.length === 0 ? (
              <p className="empty-state">暂无任务</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {todoTasks.map((task) => (
                  <li key={task.id} style={{ padding: 12, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input type="checkbox" disabled />
                    <span>{task.title}</span>
                    {task.dueLabel && <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted)' }}>{task.dueLabel}</span>}
                  </li>
                ))}
                {completedTasks.map((task) => (
                  <li key={task.id} style={{ padding: 12, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, opacity: 0.6 }}>
                    <input type="checkbox" checked disabled />
                    <span style={{ textDecoration: 'line-through' }}>{task.title}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </AdaptiveModal>

      <AdaptiveModal
        isOpen={detail === 'focus-session'}
        onClose={onClose}
        title="任务专注计时器"
        subtitle={focusDisplayTask ? focusDisplayTask.title : '当前场景暂无待办任务'}
        ariaLabel="任务专注计时器 · 工作台详情"
      >
        <div className="membership-modal-content">
          <div style={{ padding: 20, textAlign: 'center' }}>
            <strong style={{ fontSize: 48, fontWeight: 300 }}>{`${focusMinuteText}:${focusSecondText}`}</strong>
            <p style={{ color: 'var(--muted)', margin: '8px 0' }}>
              {focusDisplayTask ? `${focusDisplayTask.dueLabel} · ${focusRewardPoints} 积分` : '可先切换场景或新增任务'}
            </p>
          </div>
        </div>
      </AdaptiveModal>

      <AdaptiveModal
        isOpen={detail === 'memory-insights'}
        onClose={onClose}
        title="记忆洞察"
        subtitle="近期上下文和记忆事件"
        ariaLabel="记忆洞察 · 工作台详情"
      >
        <div className="membership-modal-content">
          <p style={{ padding: 20, color: 'var(--muted)' }}>记忆洞察模块展示近期的上下文和记忆事件详情。</p>
        </div>
      </AdaptiveModal>

      <AdaptiveModal
        isOpen={detail === 'ai-coach'}
        onClose={onClose}
        title="AI 教练"
        subtitle={activePersona.aiRole}
        ariaLabel="AI 教练 · 工作台详情"
      >
        <div className="membership-modal-content">
          <p style={{ padding: 20, color: 'var(--muted)' }}>AI 教练为当前场景提供智能辅导和建议。</p>
        </div>
      </AdaptiveModal>

      <AdaptiveModal
        isOpen={detail === 'platform-matrix'}
        onClose={onClose}
        title="跨端数据"
        subtitle="多平台数据同步状态"
        ariaLabel="跨端数据 · 工作台详情"
      >
        <div className="membership-modal-content">
          <div style={{ padding: 20 }}>
            <p style={{ marginBottom: 16 }}>当前桌面端优先，数据层已按本地优先和同步预留设计。</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {PLATFORMS.map((platform) => (
                <span key={platform} style={{ padding: '8px 16px', background: 'var(--surface-elevated)', borderRadius: 8, fontSize: 14 }}>{platform}</span>
              ))}
            </div>
          </div>
        </div>
      </AdaptiveModal>

      <AdaptiveModal
        isOpen={detail === 'statistics'}
        onClose={onClose}
        title="数据统计"
        subtitle="综合数据统计"
        ariaLabel="数据统计 · 工作台详情"
      >
        <div className="membership-modal-content">
          <div style={{ padding: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20 }}>
              <div style={{ padding: 16, background: 'var(--surface-elevated)', borderRadius: 12, textAlign: 'center' }}>
                <strong style={{ fontSize: 28 }}>{completedTasks.length}</strong>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--muted)' }}>已完成任务</p>
              </div>
              <div style={{ padding: 16, background: 'var(--surface-elevated)', borderRadius: 12, textAlign: 'center' }}>
                <strong style={{ fontSize: 28 }}>{todoTasks.length}</strong>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--muted)' }}>待办任务</p>
              </div>
              <div style={{ padding: 16, background: 'var(--surface-elevated)', borderRadius: 12, textAlign: 'center' }}>
                <strong style={{ fontSize: 28 }}>{workspaceState.focusSessions.reduce((sum, s) => sum + s.minutes, 0)}</strong>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--muted)' }}>专注分钟</p>
              </div>
              <div style={{ padding: 16, background: 'var(--surface-elevated)', borderRadius: 12, textAlign: 'center' }}>
                <strong style={{ fontSize: 28 }}>{workspaceState.growth.streakDays}</strong>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--muted)' }}>连续天数</p>
              </div>
            </div>
            <div style={{ padding: 16, background: 'var(--surface-elevated)', borderRadius: 12 }}>
              <strong style={{ fontSize: 16, marginBottom: 12, display: 'block' }}>本周进度</strong>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${weeklyProgress}%`, height: '100%', background: 'var(--primary)', borderRadius: 4 }} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{weeklyProgress}%</span>
              </div>
            </div>
          </div>
        </div>
      </AdaptiveModal>

      <AdaptiveModal
        isOpen={detail === 'cycle-today'}
        onClose={onClose}
        title="今日周期"
        subtitle="生理周期追踪"
        ariaLabel="今日周期 · 工作台详情"
      >
        <div className="membership-modal-content">
          <div style={{ padding: 20 }}>
            <p style={{ color: 'var(--muted)', marginBottom: 20 }}>点击下方按钮打开完整的周期追踪功能。</p>
            <button
              className="custom-persona-editor-btn primary"
              onClick={() => { onClose(); onOpenCycleTracker() }}
              style={{ width: '100%' }}
            >
              打开周期追踪
            </button>
          </div>
        </div>
      </AdaptiveModal>

      <AdaptiveModal
        isOpen={detail === 'memory-profile'}
        onClose={onClose}
        title="记忆画像"
        subtitle="了解你的独特风格"
        ariaLabel="记忆画像 · 工作台详情"
      >
        <div className="membership-modal-content">
          <div style={{ padding: 20 }}>
            <div style={{ marginBottom: 16 }}>
              <strong>MBTI 倾向</strong>
              <p style={{ color: 'var(--muted)', margin: '4px 0 0' }}>
                {memoryProfile.personality.mbtiTendency && memoryProfile.personality.mbtiTendency !== 'unknown' ? memoryProfile.personality.mbtiTendency : '未设置'}
              </p>
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>能量节奏</strong>
              <p style={{ color: 'var(--muted)', margin: '4px 0 0' }}>
                {memoryProfile.rhythm.energyPeak === 'morning' ? '晨间型' :
                 memoryProfile.rhythm.energyPeak === 'afternoon' ? '午后型' :
                 memoryProfile.rhythm.energyPeak === 'evening' ? '晚间型' : '未设置'}
              </p>
            </div>
            <div style={{ marginBottom: 20 }}>
              <strong>学习风格</strong>
              <p style={{ color: 'var(--muted)', margin: '4px 0 0' }}>
                {memoryProfile.learning.learningStyle === 'visual' ? '视觉型' :
                 memoryProfile.learning.learningStyle === 'auditory' ? '听觉型' :
                 memoryProfile.learning.learningStyle === 'kinesthetic' ? '动觉型' : '未设置'}
              </p>
            </div>
            <button
              className="custom-persona-editor-btn primary"
              onClick={() => { onClose(); onOpenMemoryProfile() }}
              style={{ width: '100%' }}
            >
              编辑画像
            </button>
          </div>
        </div>
      </AdaptiveModal>
    </>
  )
}
