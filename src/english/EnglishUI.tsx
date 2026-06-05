import { useState } from 'react'
import { BookOpen, Plus, Trash2, CheckCircle, Circle, FileText, BookMarked, Lightbulb } from 'lucide-react'
import { createEnglishService } from './englishService'

interface EnglishUIProps {
  compact?: boolean
  service?: ReturnType<typeof createEnglishService>
}

const colors = {
  bg: '#0f0f1a',
  cardBg: '#1a1a2e',
  cardBorder: '#2a2a4a',
  text: '#e0e0e0',
  textSecondary: '#8888aa',
  accent: '#10b981',
  inputBg: '#12121f',
  inputBorder: '#2a2a4a',
}

export function EnglishUI({ compact = false, service: externalService }: EnglishUIProps) {
  const [service] = useState(() => externalService ?? createEnglishService())
  const [tab, setTab] = useState<'words' | 'notes'>('words')
  const [showAdd, setShowAdd] = useState(false)
  const [newWord, setNewWord] = useState({ word: '', meaning: '', example: '', pronunciation: '' })
  const [newNote, setNewNote] = useState({ title: '', content: '', type: 'vocabulary' as const })

  const words = service.getWords()
  const notes = service.getNotes()
  const reviewWords = service.getWordsForReview()
  const masteredCount = words.filter((w) => w.mastered).length

  const handleAddWord = () => {
    if (!newWord.word || !newWord.meaning) return
    service.addWord(newWord.word, newWord.meaning, newWord.example, newWord.pronunciation)
    setNewWord({ word: '', meaning: '', example: '', pronunciation: '' })
    setShowAdd(false)
  }

  const handleAddNote = () => {
    if (!newNote.title || !newNote.content) return
    service.addNote(newNote.title, newNote.content, newNote.type)
    setNewNote({ title: '', content: '', type: 'vocabulary' })
    setShowAdd(false)
  }

  if (compact) {
    return (
      <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 16, width: 280, color: colors.text, fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <BookOpen size={18} style={{ color: colors.accent }} />
          <strong style={{ fontSize: 14 }}>英语学习</strong>
        </div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ color: colors.accent, fontSize: 18, fontWeight: 700 }}>{words.length}</div>
            <small style={{ color: colors.textSecondary, fontSize: 10 }}>词汇</small>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ color: colors.text, fontSize: 18, fontWeight: 700 }}>{reviewWords.length}</div>
            <small style={{ color: colors.textSecondary, fontSize: 10 }}>待复习</small>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ color: 'var(--success, #22c55e)', fontSize: 18, fontWeight: 700 }}>{masteredCount}</div>
            <small style={{ color: colors.textSecondary, fontSize: 10 }}>已掌握</small>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: colors.bg, color: colors.text, fontFamily: 'system-ui, sans-serif', minHeight: '100vh', padding: 24, overflowY: 'auto' }}>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
        <BookOpen size={24} style={{ color: colors.accent }} />英语学习
      </h2>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button onClick={() => setTab('words')} style={{ flex: 1, padding: '10px 16px', border: 'none', borderRadius: 8, background: tab === 'words' ? colors.accent : colors.cardBg, color: tab === 'words' ? '#fff' : colors.textSecondary, cursor: 'pointer', fontWeight: 500, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <BookMarked size={16} />词汇
        </button>
        <button onClick={() => setTab('notes')} style={{ flex: 1, padding: '10px 16px', border: 'none', borderRadius: 8, background: tab === 'notes' ? colors.accent : colors.cardBg, color: tab === 'notes' ? '#fff' : colors.textSecondary, cursor: 'pointer', fontWeight: 500, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <FileText size={16} />笔记
        </button>
      </div>

      {tab === 'words' && (
        <>
          <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, color: colors.textSecondary }}>词汇 ({words.length})</h3>
              <button onClick={() => setShowAdd(!showAdd)} style={{ padding: '8px 12px', background: colors.accent, border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, cursor: 'pointer' }}><Plus size={14} /></button>
            </div>
            {showAdd && (
              <div style={{ marginBottom: 16, padding: 16, background: colors.inputBg, borderRadius: 8 }}>
                <input type="text" placeholder="单词" value={newWord.word} onChange={(e) => setNewWord({ ...newWord, word: e.target.value })} style={{ width: '100%', padding: 10, border: `1px solid ${colors.inputBorder}`, borderRadius: 6, background: colors.inputBg, color: colors.text, fontSize: 14, marginBottom: 8 }} />
                <input type="text" placeholder="含义" value={newWord.meaning} onChange={(e) => setNewWord({ ...newWord, meaning: e.target.value })} style={{ width: '100%', padding: 10, border: `1px solid ${colors.inputBorder}`, borderRadius: 6, background: colors.inputBg, color: colors.text, fontSize: 14, marginBottom: 8 }} />
                <input type="text" placeholder="例句" value={newWord.example} onChange={(e) => setNewWord({ ...newWord, example: e.target.value })} style={{ width: '100%', padding: 10, border: `1px solid ${colors.inputBorder}`, borderRadius: 6, background: colors.inputBg, color: colors.text, fontSize: 14, marginBottom: 8 }} />
                <input type="text" placeholder="音标（可选）" value={newWord.pronunciation} onChange={(e) => setNewWord({ ...newWord, pronunciation: e.target.value })} style={{ width: '100%', padding: 10, border: `1px solid ${colors.inputBorder}`, borderRadius: 6, background: colors.inputBg, color: colors.text, fontSize: 14, marginBottom: 12 }} />
                <button onClick={handleAddWord} style={{ width: '100%', padding: '10px 16px', border: 'none', borderRadius: 6, background: colors.accent, color: '#fff', fontWeight: 600, cursor: 'pointer' }}>添加单词</button>
              </div>
            )}
            <div style={{ display: 'grid', gap: 8 }}>
              {words.map((word) => (
                <div key={word.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, background: colors.inputBg, borderRadius: 8, opacity: word.mastered ? 0.6 : 1 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 16 }}>{word.word}</div>
                    <div style={{ color: colors.textSecondary, fontSize: 13 }}>{word.meaning}</div>
                    {word.example && <div style={{ fontSize: 12, color: colors.textSecondary, fontStyle: 'italic', marginTop: 4 }}>"{word.example}"</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => service.toggleMastered(word.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: word.mastered ? colors.accent : colors.textSecondary }}>
                      {word.mastered ? <CheckCircle size={18} /> : <Circle size={18} />}
                    </button>
                    <button onClick={() => service.removeWord(word.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textSecondary }}><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {tab === 'notes' && (
        <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, color: colors.textSecondary }}>学习笔记 ({notes.length})</h3>
            <button onClick={() => setShowAdd(!showAdd)} style={{ padding: '8px 12px', background: colors.accent, border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, cursor: 'pointer' }}><Plus size={14} /></button>
          </div>
          {showAdd && (
            <div style={{ marginBottom: 16, padding: 16, background: colors.inputBg, borderRadius: 8 }}>
              <input type="text" placeholder="标题" value={newNote.title} onChange={(e) => setNewNote({ ...newNote, title: e.target.value })} style={{ width: '100%', padding: 10, border: `1px solid ${colors.inputBorder}`, borderRadius: 6, background: colors.inputBg, color: colors.text, fontSize: 14, marginBottom: 8 }} />
              <select value={newNote.type} onChange={(e) => setNewNote({ ...newNote, type: e.target.value as any })} style={{ width: '100%', padding: 10, border: `1px solid ${colors.inputBorder}`, borderRadius: 6, background: colors.inputBg, color: colors.text, fontSize: 14, marginBottom: 8 }}>
                <option value="vocabulary">词汇</option>
                <option value="grammar">语法</option>
                <option value="sentence">句子</option>
              </select>
              <textarea placeholder="笔记内容" value={newNote.content} onChange={(e) => setNewNote({ ...newNote, content: e.target.value })} style={{ width: '100%', minHeight: 80, padding: 10, border: `1px solid ${colors.inputBorder}`, borderRadius: 6, background: colors.inputBg, color: colors.text, fontSize: 14, marginBottom: 12, resize: 'vertical' }} />
              <button onClick={handleAddNote} style={{ width: '100%', padding: '10px 16px', border: 'none', borderRadius: 6, background: colors.accent, color: '#fff', fontWeight: 600, cursor: 'pointer' }}>添加笔记</button>
            </div>
          )}
          <div style={{ display: 'grid', gap: 8 }}>
            {notes.map((note) => (
              <div key={note.id} style={{ padding: 12, background: colors.inputBg, borderRadius: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontWeight: 500 }}>{note.title}</div>
                  <button onClick={() => service.removeNote(note.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textSecondary }}><Trash2 size={14} /></button>
                </div>
                <div style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>{note.type === 'vocabulary' ? '📚 词汇' : note.type === 'grammar' ? '📝 语法' : '💬 句子'}</div>
                <div style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 1.5 }}>{note.content.slice(0, 100)}...</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}