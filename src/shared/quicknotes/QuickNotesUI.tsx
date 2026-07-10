import { useState, useCallback } from 'react'
import { StickyNote, Pin, PinOff, Trash2, Search, Plus, X } from 'lucide-react'
import { createQuickNotesService } from './quickNotesService'
import type { QuickNotesService } from './quickNotesService'

interface QuickNotesUIProps {
  compact?: boolean
  service?: QuickNotesService
}

const colors = {
  bg: '#0f0f1a',
  cardBg: '#1a1a2e',
  cardBorder: '#2a2a4a',
  text: '#e0e0e0',
  textSecondary: '#8888aa',
  accent: '#f59e0b',
  accentLight: '#fbbf24',
  pinned: '#8b5cf6',
  inputBg: '#12121f',
  inputBorder: '#2a2a4a',
}

export function QuickNotesUI({ compact = false, service: externalService }: QuickNotesUIProps) {
  const [service] = useState<QuickNotesService>(() => externalService ?? createQuickNotesService())
  const [newNote, setNewNote] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  const state = service.getState()
  const pinnedNotes = service.getPinnedNotes()
  const recentNotes = service.getRecentNotes(5)
  const searchResults = searchQuery ? service.searchNotes(searchQuery) : null

  const handleAddNote = useCallback(() => {
    if (!newNote.trim()) return
    service.addNote(newNote.trim())
    setNewNote('')
  }, [service, newNote])

  const handleUpdateNote = useCallback((id: string) => {
    if (!editContent.trim()) return
    service.updateNote(id, editContent.trim())
    setEditingId(null)
    setEditContent('')
  }, [service, editContent])

  const startEdit = (id: string, content: string) => {
    setEditingId(id)
    setEditContent(content)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditContent('')
  }

  if (compact) {
    return (
      <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 16, width: 280, color: colors.text, fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <StickyNote size={18} style={{ color: colors.accent }} />
          <strong style={{ fontSize: 14 }}>速记</strong>
        </div>
        {pinnedNotes.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <small style={{ color: colors.textSecondary, fontSize: 10 }}>置顶笔记</small>
            {pinnedNotes.slice(0, 2).map((note) => (
              <div key={note.id} style={{ marginTop: 4, padding: '6px 8px', background: colors.inputBg, borderRadius: 6, fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {note.content}
              </div>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: colors.textSecondary, fontSize: 12 }}>{state.notes.length} 条笔记</span>
          <span style={{ color: colors.accent, fontSize: 12 }}>最近: {recentNotes[0]?.content.slice(0, 15) || '无'}...</span>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: colors.bg, color: colors.text, fontFamily: 'system-ui, sans-serif', minHeight: '100vh', padding: 24, overflowY: 'auto' }}>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
        <StickyNote size={24} style={{ color: colors.accent }} />速记
      </h2>

      <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            type="text"
            placeholder="快速记录想法..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); const val = e.currentTarget.value.trim(); if (val) { service.addNote(val); setNewNote(''); } } }}
            style={{ flex: 1, padding: '12px 16px', border: `1px solid ${colors.inputBorder}`, borderRadius: 8, background: colors.inputBg, color: colors.text, fontSize: 14 }}
          />
          <button
            onClick={handleAddNote}
            disabled={!newNote.trim()}
            style={{ padding: '12px 20px', border: 'none', borderRadius: 8, background: newNote.trim() ? colors.accent : colors.inputBorder, color: newNote.trim() ? '#000' : colors.textSecondary, fontSize: 14, fontWeight: 600, cursor: newNote.trim() ? 'pointer' : 'not-allowed' }}
          >
            <Plus size={18} />
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: colors.inputBg, borderRadius: 8 }}>
          <Search size={16} style={{ color: colors.textSecondary }} />
          <input
            type="text"
            placeholder="搜索笔记..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1, background: 'none', border: 'none', color: colors.text, fontSize: 14, outline: 'none' }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', color: colors.textSecondary, cursor: 'pointer', padding: 4 }}>
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {searchResults && (
        <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, marginBottom: 16, color: colors.textSecondary }}>搜索结果 ({searchResults.length})</h3>
          {searchResults.length === 0 ? (
            <p style={{ color: colors.textSecondary, textAlign: 'center', padding: 20 }}>没有找到匹配的笔记</p>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {searchResults.map((note) => (
                <NoteItem key={note.id} note={note} onEdit={startEdit} onTogglePin={service.togglePin} onRemove={service.removeNote} />
              ))}
            </div>
          )}
        </div>
      )}

      {pinnedNotes.length > 0 && (
        <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, marginBottom: 16, color: colors.pinned, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Pin size={14} />置顶笔记
          </h3>
          <div style={{ display: 'grid', gap: 12 }}>
            {pinnedNotes.map((note) => (
              <NoteItem key={note.id} note={note} onEdit={startEdit} onTogglePin={service.togglePin} onRemove={service.removeNote} editingId={editingId} editContent={editContent} onSaveEdit={handleUpdateNote} onCancelEdit={cancelEdit} setEditContent={setEditContent} />
            ))}
          </div>
        </div>
      )}

      <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20 }}>
        <h3 style={{ fontSize: 14, marginBottom: 16, color: colors.textSecondary }}>全部笔记 ({state.notes.length})</h3>
        {state.notes.length === 0 ? (
          <p style={{ color: colors.textSecondary, textAlign: 'center', padding: 20 }}>暂无笔记，记录你的第一个想法吧</p>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {state.notes.map((note) => (
              <NoteItem key={note.id} note={note} onEdit={startEdit} onTogglePin={service.togglePin} onRemove={service.removeNote} editingId={editingId} editContent={editContent} onSaveEdit={handleUpdateNote} onCancelEdit={cancelEdit} setEditContent={setEditContent} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function NoteItem({
  note,
  onEdit,
  onTogglePin,
  onRemove,
  editingId,
  editContent,
  onSaveEdit,
  onCancelEdit,
  setEditContent
}: {
  note: { id: string; content: string; tags: string[]; pinned: boolean; createdAt: string }
  onEdit: (id: string, content: string) => void
  onTogglePin: (id: string) => void
  onRemove: (id: string) => void
  editingId?: string | null
  editContent?: string
  onSaveEdit?: (id: string) => void
  onCancelEdit?: () => void
  setEditContent?: (content: string) => void
}) {
  const colors = {
    text: '#e0e0e0',
    textSecondary: '#8888aa',
    accent: '#f59e0b',
    pinned: '#8b5cf6',
    inputBg: '#12121f',
    inputBorder: '#2a2a4a',
  }

  if (editingId === note.id) {
    return (
      <div style={{ padding: 12, background: colors.inputBg, borderRadius: 8, border: `1px solid ${colors.accent}` }}>
        <textarea
          value={editContent}
          onChange={(e) => setEditContent?.(e.target.value)}
          style={{ width: '100%', minHeight: 60, padding: 8, border: `1px solid ${colors.inputBorder}`, borderRadius: 6, background: colors.inputBg, color: colors.text, fontSize: 14, resize: 'vertical', marginBottom: 8 }}
          autoFocus
        />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onCancelEdit} style={{ padding: '6px 12px', border: 'none', borderRadius: 6, background: colors.inputBorder, color: colors.text, fontSize: 12, cursor: 'pointer' }}>取消</button>
          <button onClick={() => onSaveEdit?.(note.id)} style={{ padding: '6px 12px', border: 'none', borderRadius: 6, background: colors.accent, color: 'var(--text)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>保存</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: 12, background: colors.inputBg, borderRadius: 8, borderLeft: note.pinned ? `3px solid ${colors.pinned}` : '3px solid transparent' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <p style={{ flex: 1, color: colors.text, fontSize: 14, lineHeight: 1.5, margin: 0 }}>{note.content}</p>
        <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
          <button onClick={() => onTogglePin(note.id)} style={{ padding: 4, background: 'none', border: 'none', color: note.pinned ? colors.pinned : colors.textSecondary, cursor: 'pointer' }}>
            {note.pinned ? <Pin size={14} /> : <PinOff size={14} />}
          </button>
          <button onClick={() => onEdit(note.id, note.content)} style={{ padding: 4, background: 'none', border: 'none', color: colors.textSecondary, cursor: 'pointer' }}>
            <Search size={14} />
          </button>
          <button onClick={() => onRemove(note.id)} style={{ padding: 4, background: 'none', border: 'none', color: colors.textSecondary, cursor: 'pointer' }}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      {note.tags.length > 0 && (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {note.tags.map((tag) => (
            <span key={tag} style={{ fontSize: 10, padding: '2px 6px', background: colors.inputBorder, borderRadius: 4, color: colors.textSecondary }}>#{tag}</span>
          ))}
        </div>
      )}
      <small style={{ display: 'block', marginTop: 8, color: colors.textSecondary, fontSize: 11 }}>
        {new Date(note.createdAt).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
      </small>
    </div>
  )
}