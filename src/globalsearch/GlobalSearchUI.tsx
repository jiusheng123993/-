import { useState, useMemo } from 'react'
import { Search, X, FileText, CheckCircle, Target, BookOpen, FolderKanban, CheckSquare, BookOpen as JournalIcon, Wallet } from 'lucide-react'
import { createSearchService } from './searchService'
import type { SearchResult } from './searchService'

interface GlobalSearchUIProps {
  compact?: boolean
  getWorkspaceState?: () => Record<string, unknown>
  getStudyState?: () => Record<string, unknown>
  getHabitState?: () => Record<string, unknown>
  getFinanceState?: () => Record<string, unknown>
  getReadingState?: () => Record<string, unknown>
  getJournalState?: () => Record<string, unknown>
  getGoalsState?: () => Record<string, unknown>
  getProjectState?: () => Record<string, unknown>
}

const colors = {
  bg: '#0f0f1a',
  cardBg: '#1a1a2e',
  cardBorder: '#2a2a4a',
  text: '#e0e0e0',
  textSecondary: '#8888aa',
  accent: '#8b5cf6',
  inputBg: '#12121f',
  inputBorder: '#2a2a4a',
}

const typeIcons: Record<string, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
  task: CheckCircle,
  note: FileText,
  goal: Target,
  book: BookOpen,
  project: FolderKanban,
  habit: CheckSquare,
  journal: JournalIcon,
  finance: Wallet
}

const typeLabels: Record<string, string> = {
  task: '任务',
  note: '笔记',
  goal: '目标',
  book: '书籍',
  project: '项目',
  habit: '习惯',
  journal: '日记',
  finance: '财务'
}

export function GlobalSearchUI({
  compact = false,
  getWorkspaceState: externalGetWorkspaceState,
  getStudyState: externalGetStudyState,
  getHabitState: externalGetHabitState,
  getFinanceState: externalGetFinanceState,
  getReadingState: externalGetReadingState,
  getJournalState: externalGetJournalState,
  getGoalsState: externalGetGoalsState,
  getProjectState: externalGetProjectState,
}: GlobalSearchUIProps) {
  const [query, setQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string | null>(null)

  const searchService = useMemo(() => {
    const getWorkspaceState = externalGetWorkspaceState || (() => ({ tasks: [] }))
    const getStudyState = externalGetStudyState || (() => ({ notes: [] }))
    const getHabitState = externalGetHabitState || (() => ({ habits: [] }))
    const getFinanceState = externalGetFinanceState || (() => ({ transactions: [] }))
    const getReadingState = externalGetReadingState || (() => ({ books: [] }))
    const getJournalState = externalGetJournalState || (() => ({ entries: [] }))
    const getGoalsState = externalGetGoalsState || (() => ({ goals: [] }))
    const getProjectState = externalGetProjectState || (() => ({ projects: [] }))
    return createSearchService(getWorkspaceState, getStudyState, getHabitState, getFinanceState, getReadingState, getJournalState, getGoalsState, getProjectState)
  }, [externalGetWorkspaceState, externalGetStudyState, externalGetHabitState, externalGetFinanceState, externalGetReadingState, externalGetJournalState, externalGetGoalsState, externalGetProjectState])

  const results: SearchResult[] = useMemo(() => {
    if (!query.trim()) return []
    const searchResults = searchService.search(query)
    return selectedType ? searchResults.filter((r) => r.type === selectedType) : searchResults
  }, [query, selectedType, searchService])

  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {}
    results.forEach((r) => {
      if (!groups[r.type]) groups[r.type] = []
      groups[r.type].push(r)
    })
    return groups
  }, [results])

  if (compact) {
    return (
      <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 16, width: 280, color: colors.text, fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Search size={18} style={{ color: colors.accent }} />
          <strong style={{ fontSize: 14 }}>全局搜索</strong>
        </div>
        <input
          type="text"
          placeholder="搜索任务、笔记..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ width: '100%', padding: '8px 12px', border: `1px solid ${colors.inputBorder}`, borderRadius: 8, background: colors.inputBg, color: colors.text, fontSize: 12 }}
        />
        {query && (
          <div style={{ marginTop: 8, fontSize: 11, color: colors.textSecondary }}>
            找到 {results.length} 条结果
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ background: colors.bg, color: colors.text, fontFamily: 'system-ui, sans-serif', minHeight: '100vh', padding: 24, overflowY: 'auto' }}>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Search size={24} style={{ color: colors.accent }} />全局搜索
      </h2>

      <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <Search size={20} style={{ color: colors.textSecondary }} />
          <input
            type="text"
            placeholder="搜索任务、笔记、目标、书籍、项目..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            style={{ flex: 1, padding: '12px 16px', border: `1px solid ${colors.inputBorder}`, borderRadius: 8, background: colors.inputBg, color: colors.text, fontSize: 16 }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ padding: 8, background: 'none', border: 'none', color: colors.textSecondary, cursor: 'pointer' }}>
              <X size={18} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => setSelectedType(null)}
            style={{
              padding: '6px 12px',
              border: 'none',
              borderRadius: 16,
              background: selectedType === null ? colors.accent : colors.inputBg,
              color: selectedType === null ? '#fff' : colors.textSecondary,
              fontSize: 12,
              cursor: 'pointer'
            }}
          >
            全部
          </button>
          {Object.entries(typeLabels).map(([type, label]) => {
            const Icon = typeIcons[type]
            return (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '6px 12px',
                  border: 'none',
                  borderRadius: 16,
                  background: selectedType === type ? colors.accent : colors.inputBg,
                  color: selectedType === type ? '#fff' : colors.textSecondary,
                  fontSize: 12,
                  cursor: 'pointer'
                }}
              >
                <Icon size={12} />{label}
              </button>
            )
          })}
        </div>
      </div>

      {!query ? (
        <div style={{ textAlign: 'center', padding: 40, color: colors.textSecondary }}>
          <Search size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
          <p>输入关键词搜索所有内容</p>
          <p style={{ fontSize: 12, marginTop: 8 }}>支持搜索任务、笔记、目标、书籍、项目、习惯、日记、财务</p>
        </div>
      ) : results.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: colors.textSecondary }}>
          <p>没有找到匹配的结果</p>
          <p style={{ fontSize: 12, marginTop: 8 }}>试试其他关键词</p>
        </div>
      ) : (
        <div>
          {Object.entries(groupedResults).map(([type, items]) => {
            const Icon = typeIcons[type]
            return (
              <div key={type} style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon size={14} />{typeLabels[type]} ({items.length})
                </h3>
                <div style={{ display: 'grid', gap: 8 }}>
                  {items.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        padding: 12,
                        background: colors.cardBg,
                        border: `1px solid ${colors.cardBorder}`,
                        borderRadius: 8,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontWeight: 500, marginBottom: 4 }}>{item.title}</div>
                          {item.description && <small style={{ color: colors.textSecondary }}>{item.description}</small>}
                        </div>
                        {item.date && <small style={{ color: colors.textSecondary, fontSize: 11 }}>{item.date}</small>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}