import { useState, useMemo } from 'react'
import { Brain, Clock, CheckCircle, X, ChevronRight, Sparkles, BookOpen, TrendingUp } from 'lucide-react'
import { createStudyService } from './studyService'
import { getDueReviews, getReviewStats, QUALITY_LABELS, QUALITY_COLORS } from './spacedRepetition'
import type { ReviewItem } from '../data/localStudyStore'

interface ReviewSchedulerUIProps {
  compact?: boolean
  onClose?: () => void
}

const colors = {
  bg: 'linear-gradient(135deg, #f8f7f4 0%, #f0efe9 100%)',
  cardBg: '#ffffff',
  cardBorder: 'rgba(0, 0, 0, 0.06)',
  text: '#2d2d2d',
  textSecondary: '#6b6b6b',
  textMuted: '#9ca3af',
  accent: '#6366f1',
  accentLight: '#eef2ff',
  accentGradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  inputBg: '#fafafa',
  inputBorder: '#e5e5e5',
  shadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
}

export function ReviewSchedulerUI({ compact = false, onClose }: ReviewSchedulerUIProps) {
  const [service] = useState(() => createStudyService())
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [selectedQuality, setSelectedQuality] = useState<number | null>(null)

  const state = service.getState()
  const dueReviews = useMemo(() => getDueReviews(state.reviews), [state.reviews])
  const stats = useMemo(() => getReviewStats(state.reviews), [state.reviews])
  const currentReview = dueReviews[currentIndex]

  const handleReview = (quality: number) => {
    if (!currentReview) return
    service.reviewItem(currentReview.id, quality as 0 | 1 | 2 | 3 | 4 | 5)
    setSelectedQuality(quality)
    setShowResult(true)
  }

  const handleNext = () => {
    setShowResult(false)
    setSelectedQuality(null)
    if (currentIndex < dueReviews.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      setCurrentIndex(0)
    }
  }

  const formatInterval = (days: number) => {
    if (days === 1) return '1 天'
    if (days < 30) return `${days} 天`
    if (days < 365) return `${Math.round(days / 30)} 个月`
    return `${Math.round(days / 365)} 年`
  }

  if (compact) {
    return (
      <div style={{
        background: colors.cardBg,
        border: `1px solid ${colors.cardBorder}`,
        borderRadius: 16,
        padding: 16,
        width: 280,
        color: colors.text,
        fontFamily: '"Inter", "Noto Sans SC", system-ui, sans-serif',
        boxShadow: colors.shadow
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Brain size={18} style={{ color: colors.accent }} />
          <strong style={{ fontSize: 14, fontWeight: 600 }}>复习提醒</strong>
        </div>
        <div style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 8 }}>
          今日待复习：<strong style={{ color: colors.accent }}>{stats.dueToday}</strong> 项
        </div>
        {stats.dueToday > 0 && (
          <div style={{
            padding: '8px 12px',
            background: colors.accentLight,
            borderRadius: 8,
            fontSize: 11,
            color: colors.accent,
            textAlign: 'center',
            cursor: 'pointer'
          }}>
            开始复习 →
          </div>
        )}
      </div>
    )
  }

  if (dueReviews.length === 0) {
    return (
      <div style={{
        background: colors.bg,
        minHeight: '100vh',
        padding: 24,
        fontFamily: '"Inter", "Noto Sans SC", system-ui, sans-serif',
        color: colors.text
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 12, margin: 0 }}>
            <Brain size={28} style={{ color: colors.accent }} />艾宾浩斯复习
          </h2>
          {onClose && (
            <button onClick={onClose} style={{ padding: 8, background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: colors.textSecondary }}>×</button>
          )}
        </div>

        <div style={{
          background: colors.cardBg,
          borderRadius: 16,
          padding: 40,
          textAlign: 'center',
          boxShadow: colors.shadow
        }}>
          <CheckCircle size={64} style={{ color: colors.success, marginBottom: 16 }} />
          <h3 style={{ fontSize: 18, marginBottom: 8 }}>太棒了！</h3>
          <p style={{ color: colors.textSecondary }}>今日没有待复习的内容</p>
          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', gap: 24 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: colors.accent }}>{stats.total}</div>
              <div style={{ fontSize: 12, color: colors.textMuted }}>总复习项</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: colors.success }}>{stats.mastered}</div>
              <div style={{ fontSize: 12, color: colors.textMuted }}>已掌握</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: colors.warning }}>{stats.learning}</div>
              <div style={{ fontSize: 12, color: colors.textMuted }}>学习中</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      background: colors.bg,
      minHeight: '100vh',
      padding: 24,
      fontFamily: '"Inter", "Noto Sans SC", system-ui, sans-serif',
      color: colors.text
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 12, margin: 0 }}>
          <Brain size={28} style={{ color: colors.accent }} />艾宾浩斯复习
        </h2>
        {onClose && (
          <button onClick={onClose} style={{ padding: 8, background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: colors.textSecondary }}>×</button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <div style={{ flex: 1, background: colors.cardBg, borderRadius: 12, padding: 16, boxShadow: colors.shadow }}>
          <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 4 }}>今日待复习</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: colors.accent }}>{dueReviews.length}</div>
        </div>
        <div style={{ flex: 1, background: colors.cardBg, borderRadius: 12, padding: 16, boxShadow: colors.shadow }}>
          <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 4 }}>本周待复习</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: colors.warning }}>{stats.dueThisWeek}</div>
        </div>
        <div style={{ flex: 1, background: colors.cardBg, borderRadius: 12, padding: 16, boxShadow: colors.shadow }}>
          <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 4 }}>已掌握</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: colors.success }}>{stats.mastered}</div>
        </div>
      </div>

      {currentReview && (
        <div style={{
          background: colors.cardBg,
          borderRadius: 16,
          padding: 24,
          boxShadow: colors.shadow,
          marginBottom: 24
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 12, color: colors.textMuted }}>
              {currentIndex + 1} / {dueReviews.length}
            </span>
            <span style={{
              padding: '4px 12px',
              background: colors.accentLight,
              color: colors.accent,
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 500
            }}>
              {currentReview.subject}
            </span>
          </div>

          <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>{currentReview.title}</h3>

          <div style={{ display: 'flex', gap: 16, marginBottom: 24, color: colors.textSecondary, fontSize: 13 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={14} />复习次数：{currentReview.reviewCount || 0}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <TrendingUp size={14} />间隔：{formatInterval(currentReview.interval || 1)}
            </span>
          </div>

          {!showResult ? (
            <div>
              <p style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 16 }}>
                回忆一下这个内容，然后选择你的记忆程度：
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {([0, 1, 2, 3, 4, 5] as const).map((q) => (
                  <button
                    key={q}
                    onClick={() => handleReview(q)}
                    style={{
                      padding: '12px 8px',
                      border: `1px solid ${colors.inputBorder}`,
                      borderRadius: 8,
                      background: colors.cardBg,
                      color: colors.text,
                      fontSize: 12,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      borderLeft: `3px solid ${QUALITY_COLORS[q]}`
                    }}
                  >
                    <div style={{ fontWeight: 500, marginBottom: 4 }}>{QUALITY_LABELS[q]}</div>
                    <div style={{ color: colors.textMuted, fontSize: 10 }}>
                      {q < 3 ? '1天后复习' : q === 3 ? '间隔不变' : `间隔${q - 2}倍`}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: selectedQuality !== null ? QUALITY_COLORS[selectedQuality] : colors.success,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <CheckCircle size={32} color="#fff" />
              </div>
              <p style={{ fontSize: 16, marginBottom: 16 }}>
                回答"<strong>{QUALITY_LABELS[selectedQuality!]}</strong>"，下次复习：<strong>{formatInterval(currentReview.interval || 1)}</strong>
              </p>
              <button
                onClick={handleNext}
                style={{
                  padding: '12px 32px',
                  background: colors.accentGradient,
                  border: 'none',
                  borderRadius: 8,
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                {currentIndex < dueReviews.length - 1 ? '下一题' : '重新开始'}
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      <div style={{
        background: colors.cardBg,
        borderRadius: 12,
        padding: 16,
        boxShadow: colors.shadow
      }}>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <BookOpen size={16} />复习队列
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {dueReviews.slice(0, 5).map((review, idx) => (
            <div
              key={review.id}
              style={{
                padding: '10px 12px',
                background: idx === currentIndex ? colors.accentLight : colors.inputBg,
                borderRadius: 8,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer'
              }}
              onClick={() => setCurrentIndex(idx)}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{review.title}</div>
                <div style={{ fontSize: 11, color: colors.textMuted }}>{review.subject}</div>
              </div>
              <span style={{ fontSize: 11, color: colors.textMuted }}>
                {idx === currentIndex ? '当前' : `${idx + 1}`}
              </span>
            </div>
          ))}
          {dueReviews.length > 5 && (
            <div style={{ fontSize: 12, color: colors.textMuted, textAlign: 'center', padding: 8 }}>
              还有 {dueReviews.length - 5} 项待复习...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
