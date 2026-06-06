import { useState, useCallback } from 'react'
import { Target, Sparkles, Layout, ArrowRight, ArrowLeft, Check } from 'lucide-react'

interface OnboardingUIProps {
  onComplete: (data: OnboardingData) => void
  onSkip: () => void
}

export interface OnboardingData {
  nickname: string
  primaryGoal: string
  selectedModules: string[]
}

const GOAL_OPTIONS = [
  { id: 'exam', label: '备考冲刺', emoji: '📚', desc: '准备考试、考证' },
  { id: 'skill', label: '技能学习', emoji: '💻', desc: '学编程、设计、语言' },
  { id: 'habit', label: '习惯养成', emoji: '🌱', desc: '培养自律和好习惯' },
  { id: 'work', label: '工作效率', emoji: '💼', desc: '提升工作效率' },
  { id: 'growth', label: '个人成长', emoji: '🚀', desc: '全面提升自己' },
  { id: 'health', label: '身心健康', emoji: '🧘', desc: '运动、冥想、睡眠' },
]

const MODULE_OPTIONS = [
  { id: 'focus-session', label: '番茄专注', emoji: '🍅', desc: '专注计时，提升效率' },
  { id: 'today-actions', label: '待办任务', emoji: '✅', desc: '管理每日任务' },
  { id: 'habit-tracker', label: '习惯追踪', emoji: '⭐', desc: '打卡养成好习惯' },
  { id: 'goal-tracker', label: '目标管理', emoji: '🎯', desc: '设定和追踪目标' },
  { id: 'journal', label: '复盘日记', emoji: '📝', desc: '每日反思和总结' },
  { id: 'study-dashboard', label: '学习仪表盘', emoji: '📖', desc: '管理学习计划' },
  { id: 'mood-tracker', label: '心情追踪', emoji: '😊', desc: '记录情绪变化' },
  { id: 'focus-history', label: '专注历史', emoji: '📊', desc: '查看专注数据' },
  { id: 'focus-stats', label: '专注统计', emoji: '📈', desc: '专注趋势分析' },
  { id: 'ai-coach', label: 'AI 搭子', emoji: '🤖', desc: '智能对话助手' },
  { id: 'reading-list', label: '阅读清单', emoji: '📚', desc: '管理阅读计划' },
  { id: 'finance-tracker', label: '财务管理', emoji: '💰', desc: '记账和预算' },
]

const STEP_TITLES = ['欢迎来到星寰海', '设定你的目标', '选择你的工具', '一切就绪！']
const STEP_SUBTITLES = [
  '你的 AI 成长工作台，陪你一起变得更好',
  '告诉我你想达成什么，我来帮你规划',
  '选择你需要的模块，打造专属工作台',
  '开始你的成长之旅吧！',
]

export function OnboardingUI({ onComplete, onSkip }: OnboardingUIProps) {
  const [step, setStep] = useState(0)
  const [nickname, setNickname] = useState('')
  const [primaryGoal, setPrimaryGoal] = useState('')
  const [selectedModules, setSelectedModules] = useState<string[]>([])

  const handleNext = useCallback(() => {
    if (step < 3) {
      setStep(step + 1)
    } else {
      onComplete({ nickname, primaryGoal, selectedModules })
    }
  }, [step, nickname, primaryGoal, selectedModules, onComplete])

  const handleBack = useCallback(() => {
    if (step > 0) setStep(step - 1)
  }, [step])

  const toggleModule = useCallback((id: string) => {
    setSelectedModules(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    )
  }, [])

  const canProceed = () => {
    if (step === 0) return nickname.trim().length > 0
    if (step === 1) return primaryGoal.length > 0
    if (step === 2) return selectedModules.length >= 3
    return true
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'var(--app-background)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2147483646,
      fontFamily: 'system-ui, sans-serif',
      color: 'var(--text)',
      padding: 24
    }}>
      <div style={{
        width: '100%',
        maxWidth: 520,
        textAlign: 'center'
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              style={{
                width: i === step ? 32 : 8,
                height: 8,
                borderRadius: 4,
                background: i <= step ? 'var(--primary)' : 'var(--surface-elevated)',
                transition: 'all 300ms'
              }}
            />
          ))}
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 8px' }}>
          {STEP_TITLES[step]}
        </h1>
        <p style={{ fontSize: 15, color: 'var(--muted)', margin: '0 0 40px', lineHeight: 1.6 }}>
          {STEP_SUBTITLES[step]}
        </p>

        {step === 0 && (
          <div style={{ marginBottom: 32 }}>
            <div style={{
              fontSize: 64,
              marginBottom: 24,
              animation: 'onboardingFloat 3s ease-in-out infinite'
            }}>
              🚀
            </div>
            <input
              type="text"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              placeholder="你的昵称是什么？"
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter' && canProceed()) handleNext() }}
              style={{
                width: '100%',
                maxWidth: 320,
                padding: '14px 20px',
                borderRadius: 12,
                border: '2px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text)',
                fontSize: 16,
                outline: 'none',
                textAlign: 'center',
                transition: 'border-color 200ms'
              }}
              onFocus={e => { e.target.style.borderColor = 'var(--primary)' }}
              onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
            />
          </div>
        )}

        {step === 1 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 12,
            marginBottom: 32
          }}>
            {GOAL_OPTIONS.map(goal => (
              <button
                key={goal.id}
                onClick={() => setPrimaryGoal(goal.id)}
                style={{
                  padding: '20px 16px',
                  borderRadius: 16,
                  border: primaryGoal === goal.id
                    ? '2px solid var(--primary)'
                    : '2px solid var(--border)',
                  background: primaryGoal === goal.id
                    ? 'color-mix(in srgb, var(--primary) 8%, var(--surface))'
                    : 'var(--surface)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 200ms'
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 8 }}>{goal.emoji}</div>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{goal.label}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{goal.desc}</div>
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
              已选择 {selectedModules.length} 个模块（至少选 3 个）
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 10,
              marginBottom: 32,
              maxHeight: 360,
              overflowY: 'auto',
              padding: '0 4px'
            }}>
              {MODULE_OPTIONS.map(mod => {
                const selected = selectedModules.includes(mod.id)
                return (
                  <button
                    key={mod.id}
                    onClick={() => toggleModule(mod.id)}
                    style={{
                      padding: '14px 10px',
                      borderRadius: 12,
                      border: selected
                        ? '2px solid var(--primary)'
                        : '2px solid var(--border)',
                      background: selected
                        ? 'color-mix(in srgb, var(--primary) 8%, var(--surface))'
                        : 'var(--surface)',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 200ms',
                      position: 'relative'
                    }}
                  >
                    {selected && (
                      <div style={{
                        position: 'absolute',
                        top: 6,
                        right: 6,
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        background: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Check size={12} color="#fff" />
                      </div>
                    )}
                    <div style={{ fontSize: 24, marginBottom: 6 }}>{mod.emoji}</div>
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{mod.label}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', lineHeight: 1.3 }}>{mod.desc}</div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ marginBottom: 32 }}>
            <div style={{
              fontSize: 64,
              marginBottom: 16,
              animation: 'onboardingFloat 3s ease-in-out infinite'
            }}>
              🎉
            </div>
            <div style={{
              padding: 24,
              borderRadius: 16,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              marginBottom: 16
            }}>
              <div style={{ marginBottom: 12 }}>
                <span style={{ color: 'var(--muted)', fontSize: 13 }}>昵称：</span>
                <strong>{nickname}</strong>
              </div>
              <div style={{ marginBottom: 12 }}>
                <span style={{ color: 'var(--muted)', fontSize: 13 }}>目标：</span>
                <strong>{GOAL_OPTIONS.find(g => g.id === primaryGoal)?.emoji} {GOAL_OPTIONS.find(g => g.id === primaryGoal)?.label}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--muted)', fontSize: 13 }}>已选模块：</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                  {selectedModules.map(id => {
                    const mod = MODULE_OPTIONS.find(m => m.id === id)
                    return mod ? (
                      <span key={id} style={{
                        padding: '4px 10px',
                        borderRadius: 20,
                        background: 'color-mix(in srgb, var(--primary) 12%, var(--surface))',
                        fontSize: 12,
                        fontWeight: 500
                      }}>
                        {mod.emoji} {mod.label}
                      </span>
                    ) : null
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          {step > 0 && (
            <button
              onClick={handleBack}
              style={{
                padding: '12px 24px',
                borderRadius: 12,
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--text)',
                cursor: 'pointer',
                fontSize: 15,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <ArrowLeft size={16} /> 上一步
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            style={{
              padding: '12px 32px',
              borderRadius: 12,
              border: 'none',
              background: canProceed() ? 'var(--primary)' : 'var(--surface-elevated)',
              color: canProceed() ? '#fff' : 'var(--muted)',
              cursor: canProceed() ? 'pointer' : 'not-allowed',
              fontSize: 15,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 200ms'
            }}
          >
            {step === 3 ? (
              <>开始使用 <Sparkles size={16} /></>
            ) : (
              <>下一步 <ArrowRight size={16} /></>
            )}
          </button>
        </div>

        {step < 3 && (
          <button
            onClick={onSkip}
            style={{
              marginTop: 24,
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: 'transparent',
              color: 'var(--muted)',
              cursor: 'pointer',
              fontSize: 13
            }}
          >
            跳过引导，直接开始
          </button>
        )}
      </div>

      <style>{`
        @keyframes onboardingFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  )
}
