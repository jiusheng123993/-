import { useState, useMemo } from 'react'
import { Quote, Heart, Plus, Trash2, Search, Star, X } from 'lucide-react'
import { createQuoteService } from './quoteService'

interface QuoteUIProps {
  compact?: boolean
  service?: ReturnType<typeof createQuoteService>
}

const colors = {
  bg: '#0f0f1a',
  cardBg: '#1a1a2e',
  cardBorder: '#2a2a4a',
  text: '#e0e0e0',
  textSecondary: '#8888aa',
  accent: '#ec4899',
  inputBg: '#12121f',
  inputBorder: '#2a2a4a',
}

export function QuoteUI({ compact = false, service: externalService }: QuoteUIProps) {
  const [service] = useState(() => externalService ?? createQuoteService())
  const [showAdd, setShowAdd] = useState(false)
  const [newQuote, setNewQuote] = useState({ content: '', author: '', source: '', tags: '' })
  const [search, setSearch] = useState('')
  const [showFavorites, setShowFavorites] = useState(false)

  const quotes = service.getQuotes()
  const displayQuotes = useMemo(() => {
    let result = quotes
    if (showFavorites) result = result.filter((q) => q.favorite)
    if (search) result = service.searchQuotes(search)
    return result
  }, [quotes, showFavorites, search, service])

  const handleAdd = () => {
    if (!newQuote.content || !newQuote.author) return
    const tags = newQuote.tags.split(',').map((t) => t.trim()).filter(Boolean)
    service.addQuote(newQuote.content, newQuote.author, newQuote.source || undefined, tags)
    setNewQuote({ content: '', author: '', source: '', tags: '' })
    setShowAdd(false)
  }

  if (compact) {
    return (
      <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 16, width: 280, color: colors.text, fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Quote size={18} style={{ color: colors.accent }} />
          <strong style={{ fontSize: 14 }}>语录</strong>
        </div>
        {quotes.length > 0 ? (
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontStyle: 'italic', marginBottom: 4, lineHeight: 1.4 }}>"{quotes[0].content.slice(0, 60)}..."</div>
            <small style={{ color: colors.textSecondary }}>— {quotes[0].author}</small>
          </div>
        ) : (
          <div style={{ fontSize: 11, color: colors.textSecondary }}>暂无语录</div>
        )}
        <div style={{ fontSize: 10, color: colors.textSecondary }}>{quotes.length} 条收藏</div>
      </div>
    )
  }

  return (
    <div style={{ background: colors.bg, color: colors.text, fontFamily: 'system-ui, sans-serif', minHeight: '100vh', padding: 24, overflowY: 'auto' }}>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Quote size={24} style={{ color: colors.accent }} />语录收藏
      </h2>

      <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input
            type="text"
            placeholder="搜索语录、作者、标签..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, padding: '10px 14px', border: `1px solid ${colors.inputBorder}`, borderRadius: 8, background: colors.inputBg, color: colors.text, fontSize: 14 }}
          />
          <button
            onClick={() => setShowFavorites(!showFavorites)}
            style={{ padding: '10px 14px', border: 'none', borderRadius: 8, background: showFavorites ? colors.accent : colors.inputBg, color: showFavorites ? '#fff' : colors.textSecondary, cursor: 'pointer' }}
          >
            <Star size={18} fill={showFavorites ? '#fff' : 'none'} />
          </button>
          <button
            onClick={() => setShowAdd(!showAdd)}
            style={{ padding: '10px 14px', border: 'none', borderRadius: 8, background: colors.accent, color: '#fff', cursor: 'pointer' }}
          >
            <Plus size={18} />
          </button>
        </div>

        {showAdd && (
          <div style={{ marginBottom: 16, padding: 16, background: colors.inputBg, borderRadius: 8 }}>
            <textarea
              placeholder="语录内容"
              value={newQuote.content}
              onChange={(e) => setNewQuote({ ...newQuote, content: e.target.value })}
              style={{ width: '100%', minHeight: 60, padding: 10, border: `1px solid ${colors.inputBorder}`, borderRadius: 6, background: colors.inputBg, color: colors.text, fontSize: 14, resize: 'vertical', marginBottom: 8 }}
            />
            <input
              type="text"
              placeholder="作者"
              value={newQuote.author}
              onChange={(e) => setNewQuote({ ...newQuote, author: e.target.value })}
              style={{ width: '100%', padding: 10, border: `1px solid ${colors.inputBorder}`, borderRadius: 6, background: colors.inputBg, color: colors.text, fontSize: 14, marginBottom: 8 }}
            />
            <input
              type="text"
              placeholder="出处（可选）"
              value={newQuote.source}
              onChange={(e) => setNewQuote({ ...newQuote, source: e.target.value })}
              style={{ width: '100%', padding: 10, border: `1px solid ${colors.inputBorder}`, borderRadius: 6, background: colors.inputBg, color: colors.text, fontSize: 14, marginBottom: 8 }}
            />
            <input
              type="text"
              placeholder="标签（逗号分隔）"
              value={newQuote.tags}
              onChange={(e) => setNewQuote({ ...newQuote, tags: e.target.value })}
              style={{ width: '100%', padding: 10, border: `1px solid ${colors.inputBorder}`, borderRadius: 6, background: colors.inputBg, color: colors.text, fontSize: 14, marginBottom: 12 }}
            />
            <button onClick={handleAdd} style={{ width: '100%', padding: '10px 16px', border: 'none', borderRadius: 6, background: colors.accent, color: '#fff', fontWeight: 600, cursor: 'pointer' }}>添加语录</button>
          </div>
        )}
      </div>

      <div style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: 12, padding: 20 }}>
        <h3 style={{ fontSize: 14, marginBottom: 16, color: colors.textSecondary }}>语录收藏 ({displayQuotes.length})</h3>
        {displayQuotes.length === 0 ? (
          <p style={{ color: colors.textSecondary, textAlign: 'center', padding: 20 }}>暂无语录</p>
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            {displayQuotes.map((quote) => (
              <div key={quote.id} style={{ padding: 16, background: colors.inputBg, borderRadius: 8, borderLeft: `3px solid ${colors.accent}` }}>
                <div style={{ fontSize: 16, fontStyle: 'italic', lineHeight: 1.6, marginBottom: 12 }}>"{quote.content}"</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontWeight: 500 }}>— {quote.author}</span>
                    {quote.source && <span style={{ color: colors.textSecondary, fontSize: 12 }}> 《{quote.source}》</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => service.toggleFavorite(quote.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: quote.favorite ? colors.accent : colors.textSecondary }}>
                      <Star size={16} fill={quote.favorite ? colors.accent : 'none'} />
                    </button>
                    <button onClick={() => service.removeQuote(quote.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textSecondary }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                {quote.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
                    {quote.tags.map((tag) => (
                      <span key={tag} style={{ fontSize: 10, padding: '2px 6px', background: colors.cardBorder, borderRadius: 4, color: colors.textSecondary }}>#{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}