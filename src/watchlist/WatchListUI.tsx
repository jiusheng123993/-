import { useState } from 'react'
import { Film, Plus, Trash2, Star, Play, CheckCircle, Circle, Clock } from 'lucide-react'
import { createWatchListService } from './watchListService'

interface WatchListUIProps {
  compact?: boolean
  service?: ReturnType<typeof createWatchListService>
}

const colors = {
  bg: 'var(--bg-primary, #0f0f1a)',
  cardBg: 'var(--surface, #1a1a2e)',
  cardBorder: 'var(--border, #2a2a4a)',
  text: 'var(--text, #e0e0e0)',
  textSecondary: 'var(--muted, #8888aa)',
  accent: '#8b5cf6',
  inputBg: 'var(--bg-secondary, #12121f)',
  inputBorder: 'var(--border, #2a2a4a)',
}

const typeLabels = { movie: '电影', tv: '电视剧', documentary: '纪录片' }
const statusLabels = { watching: '在看', completed: '已看', plan: '想看' }

export function WatchListUI({ compact = false, service: externalService }: WatchListUIProps) {
  const [service] = useState(() => externalService ?? createWatchListService())
  const [showAdd, setShowAdd] = useState(false)
  const [newItem, setNewItem] = useState({ title: '', type: 'movie' as const, genre: '' })

  const items = service.getItems()
  const stats = service.getStats()

  const handleAdd = () => {
    if (!newItem.title) return
    service.addItem(newItem.title, newItem.type, newItem.genre)
    setNewItem({ title: '', type: 'movie', genre: '' })
    setShowAdd(false)
  }

  if (compact) {
    return (
      <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 16, width: 280, color: colors.text, fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Film size={18} style={{ color: colors.accent }} />
          <strong style={{ fontSize: 14 }}>观影</strong>
        </div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ color: colors.accent, fontSize: 18, fontWeight: 700 }}>{stats.completed}</div>
            <small style={{ color: colors.textSecondary, fontSize: 10 }}>已看</small>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ color: colors.text, fontSize: 18, fontWeight: 700 }}>{stats.watching}</div>
            <small style={{ color: colors.textSecondary, fontSize: 10 }}>在看</small>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ color: 'var(--warning, #f59e0b)', fontSize: 18, fontWeight: 700 }}>{stats.plan}</div>
            <small style={{ color: colors.textSecondary, fontSize: 10 }}>想看</small>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: colors.bg, color: colors.text, fontFamily: 'system-ui, sans-serif', minHeight: '100vh', padding: 24, overflowY: 'auto' }}>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Film size={24} style={{ color: colors.accent }} />观影记录
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {Object.entries(stats).map(([key, value]) => (
          <div key={key} style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: key === 'completed' ? colors.accent : colors.text }}>{value}</div>
            <small style={{ color: colors.textSecondary }}>{key === 'total' ? '总计' : statusLabels[key as keyof typeof statusLabels]}</small>
          </div>
        ))}
      </div>

      <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, color: colors.textSecondary }}>观影列表 ({items.length})</h3>
          <button onClick={() => setShowAdd(!showAdd)} style={{ padding: '8px 12px', background: colors.accent, border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, cursor: 'pointer' }}><Plus size={14} /></button>
        </div>
        {showAdd && (
          <div style={{ marginBottom: 16, padding: 16, background: colors.inputBg, borderRadius: 8 }}>
            <input type="text" placeholder="影视名称" value={newItem.title} onChange={(e) => setNewItem({ ...newItem, title: e.target.value })} style={{ width: '100%', padding: 10, border: `1px solid ${colors.inputBorder}`, borderRadius: 6, background: colors.inputBg, color: colors.text, fontSize: 14, marginBottom: 8 }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
              <select value={newItem.type} onChange={(e) => setNewItem({ ...newItem, type: e.target.value as any })} style={{ padding: 10, border: `1px solid ${colors.inputBorder}`, borderRadius: 6, background: colors.inputBg, color: colors.text, fontSize: 14 }}>
                <option value="movie">电影</option>
                <option value="tv">电视剧</option>
                <option value="documentary">纪录片</option>
              </select>
              <input type="text" placeholder="类型/题材" value={newItem.genre} onChange={(e) => setNewItem({ ...newItem, genre: e.target.value })} style={{ padding: 10, border: `1px solid ${colors.inputBorder}`, borderRadius: 6, background: colors.inputBg, color: colors.text, fontSize: 14 }} />
            </div>
            <button onClick={handleAdd} style={{ width: '100%', padding: '10px 16px', border: 'none', borderRadius: 6, background: colors.accent, color: '#fff', fontWeight: 600, cursor: 'pointer' }}>添加到想看</button>
          </div>
        )}
        <div style={{ display: 'grid', gap: 8 }}>
          {items.map((item) => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, background: colors.inputBg, borderRadius: 8 }}>
              <div>
                <div style={{ fontWeight: 500 }}>{item.title}</div>
                <div style={{ fontSize: 12, color: colors.textSecondary }}>
                  {typeLabels[item.type]} · {item.genre} · {statusLabels[item.status]}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <select value={item.status} onChange={(e) => service.updateStatus(item.id, e.target.value as any)} style={{ padding: '4px 8px', background: colors.cardBg, border: 'none', borderRadius: 4, color: colors.textSecondary, fontSize: 11 }}>
                  <option value="plan">想看</option>
                  <option value="watching">在看</option>
                  <option value="completed">已看</option>
                </select>
                {item.status === 'completed' && (
                  <div style={{ display: 'flex' }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={14} fill={s <= (item.rating || 0) ? '#fbbf24' : 'none'} stroke={s <= (item.rating || 0) ? '#fbbf24' : colors.textSecondary} onClick={() => service.rateItem(item.id, s)} style={{ cursor: 'pointer' }} />
                    ))}
                  </div>
                )}
                <button onClick={() => service.removeItem(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textSecondary }}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}