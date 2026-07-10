import { useState } from 'react'
import { Clock, Plus, Trash2, CheckCircle, Circle, Calendar } from 'lucide-react'
import { createTimeBlockService, categoryColors } from './timeBlockService'
import type { TimeBlock } from './timeBlockService'

interface TimeBlockUIProps {
  compact?: boolean
  service?: ReturnType<typeof createTimeBlockService>
}

const colors = {
  bg: '#0f0f1a',
  cardBg: '#1a1a2e',
  cardBorder: '#2a2a4a',
  text: '#e0e0e0',
  textSecondary: '#8888aa',
  accent: '#6366f1',
  inputBg: '#12121f',
  inputBorder: '#2a2a4a',
}

const hours = Array.from({ length: 24 }, (_, i) => i)

const categoryLabels: Record<string, string> = {
  work: '工作',
  study: '学习',
  exercise: '运动',
  rest: '休息',
  other: '其他'
}

export function TimeBlockUI({ compact = false, service: externalService }: TimeBlockUIProps) {
  const [service] = useState(() => externalService ?? createTimeBlockService())
  const [showAdd, setShowAdd] = useState(false)
  const [newBlock, setNewBlock] = useState({ title: '', startHour: 9, endHour: 10, category: 'work' as TimeBlock['category'] })

  const todayBlocks = service.getTodayBlocks()
  const totalPlanned = todayBlocks.reduce((sum, b) => sum + (b.endHour - b.startHour), 0)
  const completedHours = todayBlocks.filter((b) => b.completed).reduce((sum, b) => sum + (b.endHour - b.startHour), 0)

  const handleAdd = () => {
    if (!newBlock.title) return
    service.addBlock(newBlock.title, newBlock.startHour, newBlock.endHour, newBlock.category)
    setNewBlock({ title: '', startHour: 9, endHour: 10, category: 'work' })
    setShowAdd(false)
  }

  if (compact) {
    return (
      <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 16, width: 280, color: colors.text, fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Clock size={18} style={{ color: colors.accent }} />
          <strong style={{ fontSize: 14 }}>时间块</strong>
        </div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ color: colors.accent, fontSize: 18, fontWeight: 700 }}>{totalPlanned}</div>
            <small style={{ color: colors.textSecondary, fontSize: 10 }}>规划小时</small>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ color: colors.text, fontSize: 18, fontWeight: 700 }}>{completedHours}</div>
            <small style={{ color: colors.textSecondary, fontSize: 10 }}>已完成</small>
          </div>
        </div>
        <div style={{ height: 4, background: colors.cardBorder, borderRadius: 2 }}>
          <div style={{ height: '100%', width: `${totalPlanned > 0 ? (completedHours / totalPlanned) * 100 : 0}%`, background: colors.accent, borderRadius: 2 }} />
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: colors.bg, color: colors.text, fontFamily: 'system-ui, sans-serif', minHeight: '100vh', padding: 24, overflowY: 'auto' }}>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Clock size={24} style={{ color: colors.accent }} />时间块管理
      </h2>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, padding: '12px 16px', background: colors.cardBg, borderRadius: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Calendar size={18} style={{ color: colors.textSecondary }} />
          <span style={{ fontWeight: 500 }}>今日 ({new Date().toLocaleDateString('zh-CN')})</span>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: colors.accent, border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
        >
          <Plus size={14} />添加时间块
        </button>
      </div>

      {showAdd && (
        <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, marginBottom: 16 }}>添加时间块</h3>
          <input
            type="text"
            placeholder="时间块名称"
            value={newBlock.title}
            onChange={(e) => setNewBlock({ ...newBlock, title: e.target.value })}
            style={{ width: '100%', padding: '10px 14px', border: `1px solid ${colors.inputBorder}`, borderRadius: 8, background: colors.inputBg, color: colors.text, fontSize: 14, marginBottom: 12 }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: colors.textSecondary, display: 'block', marginBottom: 4 }}>开始时间</label>
              <select
                value={newBlock.startHour}
                onChange={(e) => setNewBlock({ ...newBlock, startHour: parseInt(e.target.value), endHour: Math.max(parseInt(e.target.value) + 1, newBlock.endHour) })}
                style={{ width: '100%', padding: '10px 14px', border: `1px solid ${colors.inputBorder}`, borderRadius: 8, background: colors.inputBg, color: colors.text, fontSize: 14 }}
              >
                {hours.map((h) => (<option key={h} value={h}>{h}:00</option>))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: colors.textSecondary, display: 'block', marginBottom: 4 }}>结束时间</label>
              <select
                value={newBlock.endHour}
                onChange={(e) => setNewBlock({ ...newBlock, endHour: parseInt(e.target.value) })}
                style={{ width: '100%', padding: '10px 14px', border: `1px solid ${colors.inputBorder}`, borderRadius: 8, background: colors.inputBg, color: colors.text, fontSize: 14 }}
              >
                {hours.filter((h) => h > newBlock.startHour).map((h) => (<option key={h} value={h}>{h}:00</option>))}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {Object.entries(categoryLabels).map(([cat, label]) => (
              <button
                key={cat}
                onClick={() => setNewBlock({ ...newBlock, category: cat as TimeBlock['category'] })}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: 'none',
                  borderRadius: 6,
                  background: newBlock.category === cat ? categoryColors[cat as keyof typeof categoryColors] : colors.inputBg,
                  color: newBlock.category === cat ? '#fff' : colors.textSecondary,
                  fontSize: 12,
                  cursor: 'pointer'
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={handleAdd}
            style={{ width: '100%', padding: '12px 16px', border: 'none', borderRadius: 8, background: colors.accent, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          >
            添加
          </button>
        </div>
      )}

      <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, color: colors.textSecondary }}>今日时间线</h3>
          <span style={{ fontSize: 12, color: colors.textSecondary }}>{completedHours}/{totalPlanned} 小时</span>
        </div>
        {todayBlocks.length === 0 ? (
          <p style={{ color: colors.textSecondary, textAlign: 'center', padding: 20 }}>暂无时间块，点击上方添加</p>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {todayBlocks.map((block) => (
              <div
                key={block.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: 12,
                  background: colors.inputBg,
                  borderRadius: 8,
                  borderLeft: `4px solid ${block.color}`,
                  opacity: block.completed ? 0.6 : 1
                }}
              >
                <button
                  onClick={() => service.updateBlock(block.id, { completed: !block.completed })}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: block.completed ? '#22c55e' : colors.textSecondary }}
                >
                  {block.completed ? <CheckCircle size={20} /> : <Circle size={20} />}
                </button>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, textDecoration: block.completed ? 'line-through' : 'none' }}>{block.title}</div>
                  <small style={{ color: colors.textSecondary }}>{block.startHour}:00 - {block.endHour}:00 · {categoryLabels[block.category]}</small>
                </div>
                <button onClick={() => service.removeBlock(block.id)} style={{ padding: 4, background: 'none', border: 'none', color: colors.textSecondary, cursor: 'pointer' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20 }}>
        <h3 style={{ fontSize: 14, marginBottom: 16, color: colors.textSecondary }}>时间分布</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
          {Object.entries(categoryLabels).map(([cat, label]) => {
            const catBlocks = todayBlocks.filter((b) => b.category === cat)
            const hours = catBlocks.reduce((sum, b) => sum + (b.endHour - b.startHour), 0)
            return (
              <div key={cat} style={{ textAlign: 'center', padding: 12, background: colors.inputBg, borderRadius: 8 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: categoryColors[cat as keyof typeof categoryColors] }}>{hours}</div>
                <small style={{ color: colors.textSecondary, fontSize: 10 }}>{label}</small>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}