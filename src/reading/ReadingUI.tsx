import { useState, useCallback } from 'react'
import { BookOpen, Trash2, Star, Target, Library, BookMarked } from 'lucide-react'
import { createReadingService, readingCategories } from './readingService'
import type { ReadingService, Book } from './readingService'
import type { StudyTheme } from '../themes/themeRegistry'

interface ReadingUIProps {
  compact?: boolean
  service?: ReadingService
  theme?: StudyTheme
}

const defaultColors = {
  bg: '#0f0f1a',
  cardBg: '#1a1a2e',
  cardBorder: '#2a2a4a',
  text: '#e0e0e0',
  textSecondary: '#8888aa',
  accent: '#f59e0b',
  accentLight: '#fbbf24',
  income: '#4caf50',
  progressBg: '#2a2a4a',
  inputBg: '#12121f',
  inputBorder: '#2a2a4a',
  hoverBg: '#222240',
}

function getColors(theme?: StudyTheme) {
  if (!theme?.tokens?.colors) {
    return defaultColors
  }
  const c = theme.tokens.colors
  return {
    bg: c.surface || c.background || defaultColors.bg,
    cardBg: c.surface || defaultColors.cardBg,
    cardBorder: c.border || defaultColors.cardBorder,
    text: c.text || defaultColors.text,
    textSecondary: c.muted || defaultColors.textSecondary,
    accent: c.accent || defaultColors.accent,
    accentLight: c.secondary || defaultColors.accentLight,
    income: c.secondary || defaultColors.income,
    progressBg: c.border || defaultColors.progressBg,
    inputBg: c.surfaceStrong || c.surface || defaultColors.inputBg,
    inputBorder: c.border || defaultColors.inputBorder,
    hoverBg: c.surfaceStrong || defaultColors.hoverBg,
  }
}

export function ReadingUI({ compact = false, service: externalService, theme }: ReadingUIProps) {
  const colors = getColors(theme)
  const [service] = useState<ReadingService>(() => externalService ?? createReadingService())
  const [activeTab, setActiveTab] = useState<'library' | 'reading' | 'notes' | 'goals'>('library')
  const [bookTitle, setBookTitle] = useState('')
  const [bookAuthor, setBookAuthor] = useState('')
  const [bookPages, setBookPages] = useState('')
  const [bookCategory, setBookCategory] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [notePage, setNotePage] = useState('')
  const [newNoteType, setNewNoteType] = useState('')
  const [goalTarget, setGoalTarget] = useState('')
  const [readingPageInputs, setReadingPageInputs] = useState<Record<string, string>>({})

  const state = service.getState()
  const stats = service.getReadingStats()
  const now = new Date()
  const goalProgress = service.getGoalProgress(now.getFullYear())

  const handleAddBook = useCallback(() => {
    if (!bookTitle || !bookAuthor || !bookPages) return
    service.addBook(bookTitle, bookAuthor, parseInt(bookPages), bookCategory || '其他')
    setBookTitle('')
    setBookAuthor('')
    setBookPages('')
    setBookCategory('')
  }, [service, bookTitle, bookAuthor, bookPages, bookCategory])

  const handleSetGoal = useCallback(() => {
    if (!goalTarget) return
    service.setReadingGoal(new Date().getFullYear(), parseInt(goalTarget))
    setGoalTarget('')
  }, [service, goalTarget])

  const getStatusLabel = (status: Book['status']) => {
    switch (status) {
      case 'to-read': return '待读'
      case 'reading': return '在读'
      case 'completed': return '已读完'
      case 'paused': return '暂停'
    }
  }

  const getStatusColor = (status: Book['status']) => {
    switch (status) {
      case 'to-read': return colors.textSecondary
      case 'reading': return colors.accent
      case 'completed': return colors.income
      case 'paused': return '#9e9e9e'
    }
  }

  if (compact) {
    return (
      <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 16, width: 280, color: colors.text, fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <BookOpen size={18} style={{ color: colors.accent }} />
          <strong style={{ fontSize: 14 }}>阅读进度</strong>
        </div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ color: colors.accent, fontSize: 20, fontWeight: 700 }}>{stats.totalBooks}</div>
            <small style={{ color: colors.textSecondary, fontSize: 11 }}>藏书</small>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ color: colors.text, fontSize: 20, fontWeight: 700 }}>{stats.reading}</div>
            <small style={{ color: colors.textSecondary, fontSize: 11 }}>在读</small>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ color: colors.income, fontSize: 20, fontWeight: 700 }}>{stats.completed}</div>
            <small style={{ color: colors.textSecondary, fontSize: 11 }}>读完</small>
          </div>
        </div>
        {goalProgress.target > 0 && (
          <div style={{ paddingTop: 12, borderTop: `1px solid ${colors.cardBorder}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
              <span style={{ color: colors.textSecondary }}>年度目标</span>
              <span>{goalProgress.completed}/{goalProgress.target} ({goalProgress.percent}%)</span>
            </div>
            <div style={{ height: 4, background: colors.progressBg, borderRadius: 2 }}>
              <div style={{ height: '100%', width: `${goalProgress.percent}%`, background: colors.accent, borderRadius: 2 }} />
            </div>
          </div>
        )}
        {state.books.filter((b) => b.status === 'reading').length > 0 && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${colors.cardBorder}` }}>
            <small style={{ color: colors.textSecondary, fontSize: 11 }}>正在阅读</small>
            {state.books.filter((b) => b.status === 'reading').slice(0, 2).map((book) => (
              <div key={book.id} style={{ marginTop: 6 }}>
                <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.title}</div>
                <div style={{ height: 4, background: colors.progressBg, borderRadius: 2, marginTop: 2 }}>
                  <div style={{ height: '100%', width: `${(book.currentPage / book.totalPages) * 100}%`, background: colors.accent, borderRadius: 2 }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const tabs = [
    { id: 'library', label: '书库', icon: Library },
    { id: 'reading', label: '阅读', icon: BookMarked },
    { id: 'notes', label: '笔记', icon: BookOpen },
    { id: 'goals', label: '目标', icon: Target },
  ] as const

  return (
    <div style={{ background: colors.bg, color: colors.text, fontFamily: 'system-ui, sans-serif', minHeight: '100vh', padding: 24, overflowY: 'auto' }}>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
        <BookOpen size={24} style={{ color: colors.accent }} />阅读清单
      </h2>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: `1px solid ${colors.cardBorder}`, paddingBottom: 12 }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              border: 'none',
              borderRadius: 8,
              background: activeTab === tab.id ? colors.accent : 'transparent',
              color: activeTab === tab.id ? '#000' : colors.textSecondary,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            <tab.icon size={16} />{tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'library' && (
        <div>
          <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, marginBottom: 16 }}>添加新书</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <input
                type="text"
                placeholder="书名"
                value={bookTitle}
                onChange={(e) => setBookTitle(e.target.value)}
                style={{ padding: '10px 14px', border: `1px solid ${colors.inputBorder}`, borderRadius: 8, background: colors.inputBg, color: colors.text, fontSize: 14 }}
              />
              <input
                type="text"
                placeholder="作者"
                value={bookAuthor}
                onChange={(e) => setBookAuthor(e.target.value)}
                style={{ padding: '10px 14px', border: `1px solid ${colors.inputBorder}`, borderRadius: 8, background: colors.inputBg, color: colors.text, fontSize: 14 }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <input
                type="number"
                placeholder="总页数"
                value={bookPages}
                onChange={(e) => setBookPages(e.target.value)}
                style={{ padding: '10px 14px', border: `1px solid ${colors.inputBorder}`, borderRadius: 8, background: colors.inputBg, color: colors.text, fontSize: 14 }}
              />
              <select
                value={bookCategory}
                onChange={(e) => setBookCategory(e.target.value)}
                style={{ padding: '10px 14px', border: `1px solid ${colors.inputBorder}`, borderRadius: 8, background: colors.inputBg, color: colors.text, fontSize: 14 }}
              >
                <option value="">选择分类</option>
                {readingCategories.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
              </select>
            </div>
            <button
              onClick={handleAddBook}
              style={{ width: '100%', padding: '12px 16px', border: 'none', borderRadius: 8, background: colors.accent, color: colors.text, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >
              添加书籍
            </button>
          </div>

          <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20 }}>
            <h3 style={{ fontSize: 14, marginBottom: 16, color: colors.textSecondary }}>我的藏书 ({state.books.length})</h3>
            {state.books.length === 0 ? (
              <p style={{ color: colors.textSecondary, textAlign: 'center', padding: 20 }}>书库为空，快添加第一本书吧</p>
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                {state.books.map((book) => (
                  <div key={book.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, background: colors.inputBg, borderRadius: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500 }}>{book.title}</div>
                      <small style={{ color: colors.textSecondary }}>{book.author} · {book.category}</small>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: getStatusColor(book.status), fontSize: 12 }}>{getStatusLabel(book.status)}</span>
                      {book.rating && (
                        <div style={{ display: 'flex' }}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} size={12} fill={star <= book.rating! ? colors.accent : 'none'} stroke={star <= book.rating! ? colors.accent : colors.textSecondary} />
                          ))}
                        </div>
                      )}
                      <button onClick={() => service.removeBook(book.id)} style={{ padding: 4, background: 'none', border: 'none', color: colors.textSecondary, cursor: 'pointer' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'reading' && (
        <div>
          <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, marginBottom: 16 }}>阅读统计</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: colors.text }}>{stats.totalBooks}</div>
                <small style={{ color: colors.textSecondary }}>藏书</small>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: colors.accent }}>{stats.reading}</div>
                <small style={{ color: colors.textSecondary }}>在读</small>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: colors.income }}>{stats.completed}</div>
                <small style={{ color: colors.textSecondary }}>读完</small>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: colors.textSecondary }}>{stats.totalPages}</div>
                <small style={{ color: colors.textSecondary }}>已读页</small>
              </div>
            </div>
          </div>

          <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20 }}>
            <h3 style={{ fontSize: 14, marginBottom: 16, color: colors.textSecondary }}>正在阅读</h3>
            {state.books.filter((b) => b.status === 'reading').length === 0 ? (
              <p style={{ color: colors.textSecondary, textAlign: 'center', padding: 20 }}>暂无正在阅读的书籍</p>
            ) : (
              <div style={{ display: 'grid', gap: 16 }}>
                {state.books.filter((b) => b.status === 'reading').map((book) => (
                  <div key={book.id} style={{ padding: 16, background: colors.inputBg, borderRadius: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div>
                        <div style={{ fontWeight: 500 }}>{book.title}</div>
                        <small style={{ color: colors.textSecondary }}>{book.author}</small>
                      </div>
                      <span style={{ color: colors.accent }}>{book.currentPage} / {book.totalPages} 页</span>
                    </div>
                    <div style={{ height: 8, background: colors.progressBg, borderRadius: 4, marginBottom: 12 }}>
                      <div style={{ height: '100%', width: `${(book.currentPage / book.totalPages) * 100}%`, background: colors.accent, borderRadius: 4 }} />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="number"
                        placeholder="更新页码"
                        value={readingPageInputs[book.id] ?? ''}
                        onChange={(e) => setReadingPageInputs((prev) => ({ ...prev, [book.id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const val = parseInt(e.currentTarget.value)
                            if (val >= 0) {
                              service.updateBookProgress(book.id, val)
                              setReadingPageInputs((prev) => ({ ...prev, [book.id]: '' }))
                            }
                          }
                        }}
                        style={{ flex: 1, padding: '8px 12px', border: `1px solid ${colors.inputBorder}`, borderRadius: 6, background: colors.inputBg, color: colors.text, fontSize: 13 }}
                      />
                      <button
                        onClick={() => service.updateBookStatus(book.id, 'completed')}
                        style={{ padding: '8px 16px', border: 'none', borderRadius: 6, background: colors.income, color: '#fff', fontSize: 13, cursor: 'pointer' }}
                      >
                        标记读完
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'notes' && (
        <div>
          <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, marginBottom: 16 }}>添加笔记</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 12, marginBottom: 12 }}>
              <select
                value={newNoteType}
                onChange={(e) => {
                  setNewNoteType(e.target.value)
                  if (e.target.value) {
                    const book = state.books.find((b) => b.id === e.target.value)
                    if (book) setNotePage(String(book.currentPage || 1))
                  }
                }}
                style={{ padding: '10px 14px', border: `1px solid ${colors.inputBorder}`, borderRadius: 8, background: colors.inputBg, color: colors.text, fontSize: 14 }}
              >
                <option value="">选择书籍</option>
                {state.books.map((book) => (<option key={book.id} value={book.id}>{book.title}</option>))}
              </select>
              <input
                type="number"
                placeholder="页码"
                value={notePage}
                onChange={(e) => setNotePage(e.target.value)}
                style={{ padding: '10px 14px', border: `1px solid ${colors.inputBorder}`, borderRadius: 8, background: colors.inputBg, color: colors.text, fontSize: 14 }}
              />
            </div>
            <textarea
              placeholder="写下你的读书笔记..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              style={{ width: '100%', minHeight: 80, padding: '10px 14px', border: `1px solid ${colors.inputBorder}`, borderRadius: 8, background: colors.inputBg, color: colors.text, fontSize: 14, marginBottom: 12, resize: 'vertical' }}
            />
            <button
              onClick={() => {
                if (newNoteType && noteContent) {
                  service.addNote(newNoteType, parseInt(notePage) || 1, noteContent)
                  setNoteContent('')
                  setNotePage('')
                  setNewNoteType('')
                }
              }}
              style={{ width: '100%', padding: '12px 16px', border: 'none', borderRadius: 8, background: colors.accent, color: colors.text, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >
              添加笔记
            </button>
          </div>

          <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20 }}>
            <h3 style={{ fontSize: 14, marginBottom: 16, color: colors.textSecondary }}>读书笔记 ({state.notes.length})</h3>
            {state.notes.length === 0 ? (
              <p style={{ color: colors.textSecondary, textAlign: 'center', padding: 20 }}>暂无笔记</p>
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                {state.notes.slice().reverse().map((note) => {
                  const book = state.books.find((b) => b.id === note.bookId)
                  return (
                    <div key={note.id} style={{ padding: 12, background: colors.inputBg, borderRadius: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <strong>{book?.title || '未知书籍'}</strong>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <small style={{ color: colors.textSecondary }}>第{note.page}页</small>
                          <button onClick={() => service.removeNote(note.id)} style={{ padding: 4, background: 'none', border: 'none', color: colors.textSecondary, cursor: 'pointer' }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <p style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 1.5 }}>{note.content}</p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'goals' && (
        <div>
          <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, marginBottom: 16 }}>设置年度阅读目标</h3>
            <div style={{ display: 'flex', gap: 12 }}>
              <input
                type="number"
                placeholder={`${now.getFullYear()}年目标数量`}
                value={goalTarget}
                onChange={(e) => setGoalTarget(e.target.value)}
                style={{ flex: 1, padding: '10px 14px', border: `1px solid ${colors.inputBorder}`, borderRadius: 8, background: colors.inputBg, color: colors.text, fontSize: 14 }}
              />
              <button
                onClick={handleSetGoal}
                style={{ padding: '10px 20px', border: 'none', borderRadius: 8, background: colors.accent, color: colors.text, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
              >
                设置目标
              </button>
            </div>
          </div>

          <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20 }}>
            <h3 style={{ fontSize: 14, marginBottom: 16, color: colors.textSecondary }}>年度目标进度</h3>
            {goalProgress.target === 0 ? (
              <p style={{ color: colors.textSecondary, textAlign: 'center', padding: 20 }}>请先设置年度阅读目标</p>
            ) : (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <div style={{ fontSize: 48, fontWeight: 700, color: colors.accent, marginBottom: 8 }}>{goalProgress.percent}%</div>
                <div style={{ color: colors.textSecondary, marginBottom: 16 }}>
                  {goalProgress.completed} / {goalProgress.target} 本
                </div>
                <div style={{ height: 12, background: colors.progressBg, borderRadius: 6 }}>
                  <div style={{ height: '100%', width: `${goalProgress.percent}%`, background: colors.accent, borderRadius: 6 }} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}