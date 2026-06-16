import { useState, useEffect, useCallback, useMemo } from 'react'
import { Brain, Plus, Trash2, CheckCircle2, Circle, Clock, AlertCircle } from 'lucide-react'
import { reviewRepository, type ReviewItem as SupabaseReviewItem, type CreateReviewInput as SupabaseCreateReviewInput } from '../data/repositories/reviewRepository'
import { createLocalReviewStore, type ReviewItem, type CreateReviewInput, type ReviewStore } from './reviewStore'
import { createErrorHandler } from '../utils/errorHandler'

interface ReviewSchedulerUIProps {
  userId: string
  onClose?: () => void
  dataSource?: 'local' | 'supabase'
}

const colors = {
  bg: '#0f0f1a',
  cardBg: '#1a1a2e',
  cardBorder: '#2a2a4a',
  text: '#e0e0e0',
  textSecondary: '#8888aa',
  textMuted: '#555577',
  accent: '#8b5cf6',
  accentLight: 'rgba(139, 92, 246, 0.15)',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  inputBg: '#12121f',
  inputBorder: '#2a2a4a',
  shadow: '0 4px 24px rgba(0, 0, 0, 0.2)',
}

const levelLabels: Record<string, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
}

const levelColors: Record<string, string> = {
  easy: colors.success,
  medium: colors.warning,
  hard: colors.danger,
}

export function ReviewSchedulerUI({ userId, onClose, dataSource = 'local' }: ReviewSchedulerUIProps) {
  const [items, setItems] = useState<ReviewItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const handleError = useMemo(() => createErrorHandler({ setError, moduleName: '复习计划' }), [])
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    dueDate: '',
    level: 'medium' as string,
  })

  const store: ReviewStore = useMemo(() => {
    if (dataSource === 'supabase') {
      return {
        findByUserId: async (uid: string) => {
          const data = await reviewRepository.findByUserId(uid)
          return data.map((item: SupabaseReviewItem) => ({
            id: item.id,
            userId: item.userId,
            title: item.title,
            subject: item.subject,
            dueDate: item.dueDate,
            level: item.level,
            interval: item.interval,
            easeFactor: item.easeFactor,
            reviewCount: item.reviewCount,
            lastReviewDate: item.lastReviewDate,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          }))
        },
        create: async (input: CreateReviewInput) => {
          const supabaseInput: SupabaseCreateReviewInput = {
            userId: input.userId,
            title: input.title,
            subject: input.subject,
            dueDate: input.dueDate,
            level: input.level,
          }
          const result = await reviewRepository.create(supabaseInput)
          return {
            id: result.id,
            userId: result.userId,
            title: result.title,
            subject: result.subject,
            dueDate: result.dueDate,
            level: result.level,
            interval: result.interval,
            easeFactor: result.easeFactor,
            reviewCount: result.reviewCount,
            lastReviewDate: result.lastReviewDate,
            createdAt: result.createdAt,
            updatedAt: result.updatedAt,
          }
        },
        update: async (id: string, patch) => {
          const result = await reviewRepository.update(id, patch)
          return {
            id: result.id,
            userId: result.userId,
            title: result.title,
            subject: result.subject,
            dueDate: result.dueDate,
            level: result.level,
            interval: result.interval,
            easeFactor: result.easeFactor,
            reviewCount: result.reviewCount,
            lastReviewDate: result.lastReviewDate,
            createdAt: result.createdAt,
            updatedAt: result.updatedAt,
          }
        },
        delete: async (id: string) => {
          await reviewRepository.delete(id)
        },
      }
    }
    return createLocalReviewStore()
  }, [dataSource])

  const loadItems = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await store.findByUserId(userId)
      setItems(data)
    } catch (err) {
      handleError(err, '加载失败')
    } finally {
      setLoading(false)
    }
  }, [userId, store, handleError])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  const handleCreate = async () => {
    if (!formData.title.trim()) return
    try {
      const input: CreateReviewInput = {
        userId,
        title: formData.title.trim(),
        subject: formData.subject.trim() || undefined,
        dueDate: formData.dueDate || undefined,
        level: formData.level,
      }
      await store.create(input)
      setFormData({ title: '', subject: '', dueDate: '', level: 'medium' })
      setShowAddForm(false)
      loadItems()
    } catch (err) {
      handleError(err, '创建失败')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await store.delete(id)
      loadItems()
    } catch (err) {
      handleError(err, '删除失败')
    }
  }

  const handleToggleComplete = async (item: ReviewItem) => {
    try {
      const newLevel = item.level === 'easy' ? 'medium' : item.level === 'medium' ? 'hard' : 'easy'
      await store.update(item.id, {
        level: newLevel,
        reviewCount: item.reviewCount + 1,
        lastReviewDate: new Date().toISOString().split('T')[0],
      })
      loadItems()
    } catch (err) {
      handleError(err, '更新失败')
    }
  }

  const dueItems = items.filter((i) => {
    if (!i.dueDate) return false
    return new Date(i.dueDate) <= new Date()
  })
  const upcomingItems = items.filter((i) => {
    if (!i.dueDate) return true
    return new Date(i.dueDate) > new Date()
  })

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '未设置'
    const d = new Date(dateStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const target = new Date(d)
    target.setHours(0, 0, 0, 0)
    const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (diff === 0) return '今天'
    if (diff === 1) return '明天'
    if (diff < 0) return `已过期 ${Math.abs(diff)} 天`
    if (diff <= 7) return `${diff} 天后`
    return dateStr
  }

  return (
    <div style={{
      background: colors.bg,
      minHeight: '100%',
      padding: 24,
      fontFamily: '"Inter", "Noto Sans SC", system-ui, sans-serif',
      color: colors.text,
      overflowY: 'auto',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 12, margin: 0 }}>
          <Brain size={28} style={{ color: colors.accent }} />复习提醒
        </h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setShowAddForm(true)}
            style={{
              padding: '10px 20px',
              background: `linear-gradient(135deg, ${colors.accent}, #6366f1)`,
              border: 'none',
              borderRadius: 10,
              color: '#fff',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Plus size={16} />新建复习项
          </button>
          {onClose && (
            <button onClick={onClose} style={{
              padding: 10,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 20,
              color: colors.textSecondary,
              borderRadius: 8,
            }}>×</button>
          )}
        </div>
      </div>

      {error && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 8,
          color: colors.danger,
          fontSize: 13,
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <div style={{ flex: 1, background: colors.cardBg, borderRadius: 12, padding: 16, boxShadow: colors.shadow }}>
          <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 4 }}>待复习</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: colors.warning }}>{dueItems.length}</div>
        </div>
        <div style={{ flex: 1, background: colors.cardBg, borderRadius: 12, padding: 16, boxShadow: colors.shadow }}>
          <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 4 }}>即将到来</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: colors.accent }}>{upcomingItems.length}</div>
        </div>
        <div style={{ flex: 1, background: colors.cardBg, borderRadius: 12, padding: 16, boxShadow: colors.shadow }}>
          <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 4 }}>总计</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: colors.text }}>{items.length}</div>
        </div>
      </div>

      {showAddForm && (
        <div style={{
          background: colors.cardBg,
          border: `1px solid ${colors.cardBorder}`,
          borderRadius: 12,
          padding: 20,
          marginBottom: 24,
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>新建复习项</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              type="text"
              placeholder="标题（必填）"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              style={{
                padding: 10,
                border: `1px solid ${colors.inputBorder}`,
                borderRadius: 8,
                background: colors.inputBg,
                color: colors.text,
                fontSize: 14,
              }}
            />
            <input
              type="text"
              placeholder="科目/分类"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              style={{
                padding: 10,
                border: `1px solid ${colors.inputBorder}`,
                borderRadius: 8,
                background: colors.inputBg,
                color: colors.text,
                fontSize: 14,
              }}
            />
            <div style={{ display: 'flex', gap: 12 }}>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                style={{
                  flex: 1,
                  padding: 10,
                  border: `1px solid ${colors.inputBorder}`,
                  borderRadius: 8,
                  background: colors.inputBg,
                  color: colors.text,
                  fontSize: 14,
                }}
              />
              <select
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                style={{
                  flex: 1,
                  padding: 10,
                  border: `1px solid ${colors.inputBorder}`,
                  borderRadius: 8,
                  background: colors.inputBg,
                  color: colors.text,
                  fontSize: 14,
                }}
              >
                <option value="easy">简单</option>
                <option value="medium">中等</option>
                <option value="hard">困难</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowAddForm(false)}
                style={{
                  padding: '8px 16px',
                  background: 'transparent',
                  border: `1px solid ${colors.inputBorder}`,
                  borderRadius: 8,
                  color: colors.textSecondary,
                  cursor: 'pointer',
                }}
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                style={{
                  padding: '8px 16px',
                  background: colors.accent,
                  border: 'none',
                  borderRadius: 8,
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: colors.textMuted }}>
          <Clock size={24} style={{ margin: '0 auto 8px', display: 'block' }} />
          加载中...
        </div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: colors.textMuted }}>
          <Brain size={48} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
          暂无复习项，点击上方按钮创建
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map((item) => {
            const isDue = item.dueDate && new Date(item.dueDate) <= new Date()
            return (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 16px',
                  background: colors.cardBg,
                  border: `1px solid ${isDue ? levelColors[item.level] : colors.cardBorder}`,
                  borderRadius: 12,
                  transition: 'all 0.2s',
                }}
              >
                <button
                  onClick={() => handleToggleComplete(item)}
                  style={{
                    padding: 4,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: item.reviewCount > 0 ? colors.success : colors.textMuted,
                    display: 'flex',
                  }}
                >
                  {item.reviewCount > 0 ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{item.title}</div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 12, color: colors.textSecondary }}>
                    {item.subject && <span>{item.subject}</span>}
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} />
                      {formatDate(item.dueDate)}
                    </span>
                    <span style={{
                      padding: '1px 6px',
                      borderRadius: 4,
                      background: `${levelColors[item.level]}20`,
                      color: levelColors[item.level],
                      fontSize: 11,
                    }}>
                      {levelLabels[item.level]}
                    </span>
                    <span>复习 {item.reviewCount} 次</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  style={{
                    padding: 6,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: colors.textMuted,
                    display: 'flex',
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
