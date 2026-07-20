import { useState, useRef, useCallback } from 'react'
import type { QuickNote } from '../../quicknotes/quickNotesService'
import styles from './QuickNotesModule.module.css'

interface QuickNotesModuleProps {
  onRemove: () => void
}

const STORAGE_KEY = 'xinghuanhai-quicknotes-state'

function loadNotes(): QuickNote[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const state = JSON.parse(raw)
      return state.notes || []
    }
  } catch { /* ignore */ }
  return []
}

function saveNotes(notes: QuickNote[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ notes }))
}

export function QuickNotesModule({ onRemove }: QuickNotesModuleProps) {
  const [notes, setNotes] = useState<QuickNote[]>(() => loadNotes())
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleAdd = useCallback(() => {
    const trimmed = input.trim()
    if (!trimmed) return
    const now = new Date().toISOString()
    const note: QuickNote = {
      id: crypto.randomUUID(),
      content: trimmed,
      tags: [],
      pinned: false,
      createdAt: now,
      updatedAt: now
    }
    const next = [note, ...notes]
    setNotes(next)
    saveNotes(next)
    setInput('')
    inputRef.current?.focus()
  }, [input, notes])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }, [handleAdd])

  const handleDelete = useCallback((id: string) => {
    const next = notes.filter((n) => n.id !== id)
    setNotes(next)
    saveNotes(next)
  }, [notes])

  const recentNotes = notes.slice(0, 5)

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.title}>灵感一闪</span>
        <button className={styles.removeBtn} onClick={onRemove} type="button" title="移除">×</button>
      </div>

      <div className={styles.inputRow}>
        <input
          ref={inputRef}
          className={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="一闪而过的想法..."
          maxLength={200}
        />
        <button
          className={styles.addBtn}
          onClick={handleAdd}
          disabled={!input.trim()}
          type="button"
        >
          +
        </button>
      </div>

      {recentNotes.length > 0 ? (
        <div className={styles.noteList}>
          {recentNotes.map((note) => (
            <div key={note.id} className={styles.noteItem}>
              <span className={styles.noteContent}>{note.content}</span>
              <button
                className={styles.noteDelete}
                onClick={() => handleDelete(note.id)}
                type="button"
                title="删除"
              >
                ×
              </button>
            </div>
          ))}
          {notes.length > 5 && (
            <div className={styles.noteMore}>+{notes.length - 5} 条更早...</div>
          )}
        </div>
      ) : (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>✨</span>
          <span className={styles.emptyText}>记录一闪而过的灵感</span>
        </div>
      )}
    </div>
  )
}
