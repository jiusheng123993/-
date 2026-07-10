import { useState, useCallback, useMemo } from 'react'
import { usePlatform } from '../../shared/platforms'
import {
  loadState,
  saveState,
  createDeck,
  updateDeck,
  deleteDeck,
  setActiveDeck,
  addCard,
  deleteCard,
  updateCard,
  reviewCard,
  getDueCards,
  getDeckStats,
  getGlobalStats,
  getReviewStats,
  searchCards,
  DECK_ICONS,
  DECK_COLORS,
  type Deck,
  type MemoryCard,
  type MemoryCardsState
} from './memoryCardsService'
import { sendAgentChatMessageStream } from '../../ai-partner/agent/agentRuntime'
import { useApiKeyStatus } from '../../shared/hooks/useApiKeyStatus'
import styles from './MemoryCardsUI.module.css'

const QUALITY_LABELS: Record<number, string> = {
  0: '完全忘记',
  1: '有印象但错',
  2: '严重犹豫',
  3: '有些犹豫',
  4: '基本正确',
  5: '完全正确'
}

interface AIExtractedCard {
  front: string
  back: string
}

export function MemoryCardsUI() {
  const [state, setState] = useState<MemoryCardsState>(() => loadState())
  const [showAddForm, setShowAddForm] = useState(false)
  const [showAIForm, setShowAIForm] = useState(false)
  const [showDeckForm, setShowDeckForm] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [editingDeckId, setEditingDeckId] = useState<string | null>(null)
  const [editingCardId, setEditingCardId] = useState<string | null>(null)
  const { deviceCategory } = usePlatform()
  const isMobile = deviceCategory === 'mobile'
  const [reviewingCardId, setReviewingCardId] = useState<string | null>(null)
  const [flippedCardId, setFlippedCardId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const [newFront, setNewFront] = useState('')
  const [newBack, setNewBack] = useState('')
  const [newTags, setNewTags] = useState('')

  const [editFront, setEditFront] = useState('')
  const [editBack, setEditBack] = useState('')
  const [editTags, setEditTags] = useState('')

  const [deckName, setDeckName] = useState('')
  const [deckIcon, setDeckIcon] = useState(DECK_ICONS[0])
  const [deckColor, setDeckColor] = useState(DECK_COLORS[0])

  const [aiInput, setAiInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiCards, setAiCards] = useState<AIExtractedCard[]>([])
  const [selectedAiCards, setSelectedAiCards] = useState<Set<number>>(new Set())

  const { hasAnyKey } = useApiKeyStatus()

  const activeDeck = state.decks.find(d => d.id === state.activeDeckId) || null
  const globalStats = getGlobalStats(state)
  const deckStats = activeDeck ? getDeckStats(state, activeDeck.id) : null
  const dueCards = getDueCards(state, state.activeDeckId)
  const reviewStats = useMemo(() => getReviewStats(state), [state])
  const searchResults = useMemo(() => searchCards(state, searchQuery), [state, searchQuery])
  const isSearching = searchQuery.trim().length > 0

  const persist = useCallback((newState: MemoryCardsState) => {
    setState(newState)
    saveState(newState)
  }, [])

  const handleCreateDeck = () => {
    if (!deckName.trim()) return
    const newState = createDeck(state, deckName.trim(), deckIcon, deckColor)
    persist(newState)
    setDeckName('')
    setDeckIcon(DECK_ICONS[0])
    setDeckColor(DECK_COLORS[0])
    setShowDeckForm(false)
  }

  const handleUpdateDeck = () => {
    if (!editingDeckId || !deckName.trim()) return
    const newState = updateDeck(state, editingDeckId, { name: deckName.trim(), icon: deckIcon, color: deckColor })
    persist(newState)
    setDeckName('')
    setEditingDeckId(null)
    setShowDeckForm(false)
  }

  const handleDeleteDeck = (deckId: string) => {
    const deck = state.decks.find(d => d.id === deckId)
    if (!deck) return
    const cardCount = state.cards.filter(c => c.deckId === deckId).length
    const confirmed = window.confirm(
      `确定要删除牌组「${deck.name}」吗？\n将同时删除该牌组下的 ${cardCount} 张卡片，此操作不可撤销。`
    )
    if (!confirmed) return
    const newState = deleteDeck(state, deckId)
    persist(newState)
  }

  const handleSelectDeck = (deckId: string | null) => {
    const newState = setActiveDeck(state, deckId)
    persist(newState)
  }

  const openEditDeck = (deck: Deck) => {
    setDeckName(deck.name)
    setDeckIcon(deck.icon)
    setDeckColor(deck.color)
    setEditingDeckId(deck.id)
    setShowDeckForm(true)
  }

  const handleAdd = () => {
    if (!newFront.trim() || !newBack.trim() || !state.activeDeckId) return
    const tags = newTags.split(',').map(t => t.trim()).filter(Boolean)
    const newState = addCard(state, state.activeDeckId, newFront.trim(), newBack.trim(), tags)
    persist(newState)
    setNewFront('')
    setNewBack('')
    setNewTags('')
    setShowAddForm(false)
  }

  const handleDelete = (cardId: string) => {
    const newState = deleteCard(state, cardId)
    persist(newState)
    setReviewingCardId(null)
    setFlippedCardId(null)
    setEditingCardId(null)
  }

  const handleStartEdit = (card: MemoryCard) => {
    setEditingCardId(card.id)
    setEditFront(card.front)
    setEditBack(card.back)
    setEditTags(card.tags.join(', '))
    setReviewingCardId(null)
    setFlippedCardId(null)
  }

  const handleSaveEdit = () => {
    if (!editingCardId || !editFront.trim() || !editBack.trim()) return
    const tags = editTags.split(',').map(t => t.trim()).filter(Boolean)
    const newState = updateCard(state, editingCardId, {
      front: editFront.trim(),
      back: editBack.trim(),
      tags
    })
    persist(newState)
    setEditingCardId(null)
  }

  const handleCancelEdit = () => {
    setEditingCardId(null)
  }

  const handleReview = (cardId: string, quality: 0 | 1 | 2 | 3 | 4 | 5) => {
    const newState = reviewCard(state, cardId, quality)
    persist(newState)
    setReviewingCardId(null)
    setFlippedCardId(null)
  }

  const handleAIExtract = async () => {
    if (!aiInput.trim()) return
    setAiLoading(true)
    setAiError(null)
    setAiCards([])
    setSelectedAiCards(new Set())

    const controller = new AbortController()

    try {
      let fullResponse = ''

      await sendAgentChatMessageStream({
        message: aiInput,
        personaId: 'exam-student',
        useXFYunCoding: true,
        signal: controller.signal,
        onChunk: (chunk) => {
          fullResponse += chunk
        }
      })

      const jsonMatch = fullResponse.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const cards = JSON.parse(jsonMatch[0]) as AIExtractedCard[]
        if (Array.isArray(cards) && cards.length > 0) {
          setAiCards(cards)
          setSelectedAiCards(new Set(cards.map((_, i) => i)))
        } else {
          setAiError('AI 未能提取到有效卡片，请尝试更详细的内容')
        }
      } else {
        setAiError('AI 返回格式异常，请重试')
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setAiError(err instanceof Error ? err.message : 'AI 提取失败')
    } finally {
      setAiLoading(false)
    }
  }

  const handleImportSelected = () => {
    if (!state.activeDeckId) return
    let newState = state
    selectedAiCards.forEach((index) => {
      const card = aiCards[index]
      if (card) {
        newState = addCard(newState, state.activeDeckId!, card.front, card.back, [])
      }
    })
    persist(newState)
    setAiCards([])
    setSelectedAiCards(new Set())
    setAiInput('')
    setShowAIForm(false)
  }

  const toggleAiCardSelection = (index: number) => {
    setSelectedAiCards(prev => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  const renderCard = (card: MemoryCard) => {
    const deck = state.decks.find(d => d.id === card.deckId)

    if (editingCardId === card.id) {
      return (
        <div key={card.id} className={styles.card}>
          <div className={styles.editForm}>
            <textarea
              className={styles.textarea}
              placeholder="正面：问题或概念"
              value={editFront}
              onChange={e => setEditFront(e.target.value)}
              rows={2}
            />
            <textarea
              className={styles.textarea}
              placeholder="背面：答案或解释"
              value={editBack}
              onChange={e => setEditBack(e.target.value)}
              rows={2}
            />
            <input
              className={styles.input}
              placeholder="标签（逗号分隔）"
              value={editTags}
              onChange={e => setEditTags(e.target.value)}
            />
            <div className={styles.formActions}>
              <button className={styles.cancelButton} onClick={handleCancelEdit}>
                取消
              </button>
              <button
                className={styles.submitButton}
                onClick={handleSaveEdit}
                disabled={!editFront.trim() || !editBack.trim()}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div
        key={card.id}
        className={`${styles.card} ${reviewingCardId === card.id ? styles.cardReviewing : ''}`}
      >
        <div
          className={styles.cardFace}
          onClick={() => {
            if (reviewingCardId === card.id) {
              setFlippedCardId(flippedCardId === card.id ? null : card.id)
            } else {
              setReviewingCardId(card.id)
              setFlippedCardId(null)
            }
          }}
        >
          <div className={styles.cardFront}>
            <span className={styles.cardLabel}>问题 {deck && <span className={styles.cardDeckBadge} style={{ background: deck.color }}>{deck.icon} {deck.name}</span>}</span>
            <p className={styles.cardText}>{card.front}</p>
          </div>
          {(reviewingCardId === card.id && flippedCardId === card.id) && (
            <div className={styles.cardBack}>
              <span className={styles.cardLabel}>答案</span>
              <p className={styles.cardText}>{card.back}</p>
            </div>
          )}
          {reviewingCardId !== card.id && (
            <span className={styles.cardHint}>点击展开复习</span>
          )}
        </div>

        {reviewingCardId === card.id && flippedCardId === card.id && (
          <div className={styles.ratingBar}>
            <span className={styles.ratingLabel}>你的掌握程度：</span>
            <div className={styles.ratingButtons}>
              {([0, 1, 2, 3, 4, 5] as const).map(q => (
                <button
                  key={q}
                  className={`${styles.ratingButton} ${q >= 4 ? styles.ratingGood : q >= 2 ? styles.ratingMedium : styles.ratingBad}`}
                  onClick={() => handleReview(card.id, q)}
                  title={isMobile ? undefined : QUALITY_LABELS[q]}
                >
                  {q}
                </button>
              ))}
            </div>
            <div className={styles.ratingHints}>
              {([0, 1, 2, 3, 4, 5] as const).map(q => (
                <span key={q} className={styles.ratingHint}>{QUALITY_LABELS[q]}</span>
              ))}
            </div>
          </div>
        )}

        <div className={styles.cardMeta}>
          {card.tags.length > 0 && (
            <div className={styles.tags}>
              {card.tags.map(tag => (
                <span key={tag} className={styles.tag}>{tag}</span>
              ))}
            </div>
          )}
          <span className={styles.cardInfo}>
            复习 {card.reviewCount} 次 · 间隔 {card.interval} 天
          </span>
        </div>

        <div className={styles.cardActions}>
          <button
            className={styles.editButton}
            onClick={() => handleStartEdit(card)}
          >
            编辑
          </button>
          <button
            className={styles.deleteButton}
            onClick={() => handleDelete(card.id)}
          >
            删除
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>记忆卡</h2>
        <div className={styles.headerActions}>
          <button
            className={styles.statsButton}
            onClick={() => setShowStats(!showStats)}
          >
            {showStats ? '📋 返回' : '📊 统计'}
          </button>
          <span className={styles.count}>{globalStats.deckCount} 牌组 · {globalStats.total} 卡片</span>
        </div>
      </div>

      <div className={styles.searchBar}>
        <input
          className={styles.searchInput}
          placeholder="搜索卡片内容或标签..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        {isSearching && (
          <span className={styles.searchCount}>找到 {searchResults.length} 张</span>
        )}
      </div>

      <div className={styles.deckBar}>
        <div className={styles.deckList}>
          <button
            className={`${styles.deckTab} ${state.activeDeckId === null ? styles.deckTabActive : ''}`}
            onClick={() => handleSelectDeck(null)}
            style={state.activeDeckId === null ? { borderColor: '#22c55e', color: '#22c55e' } : undefined}
          >
            <span className={styles.deckTabIcon}>📋</span>
            <span className={styles.deckTabName}>全部</span>
            <span className={styles.deckTabCount}>{globalStats.due}</span>
          </button>
          {state.decks.map(deck => (
            <button
              key={deck.id}
              className={`${styles.deckTab} ${state.activeDeckId === deck.id ? styles.deckTabActive : ''}`}
              onClick={() => handleSelectDeck(deck.id)}
              onContextMenu={(e) => {
                e.preventDefault()
                openEditDeck(deck)
              }}
              style={state.activeDeckId === deck.id ? { borderColor: deck.color, color: deck.color } : undefined}
              title="右键编辑牌组"
            >
              <span className={styles.deckTabIcon}>{deck.icon}</span>
              <span className={styles.deckTabName}>{deck.name}</span>
              <span className={styles.deckTabCount}>{getDeckStats(state, deck.id).due}</span>
            </button>
          ))}
          <button
            className={styles.deckAddButton}
            onClick={() => {
              setDeckName('')
              setDeckIcon(DECK_ICONS[0])
              setDeckColor(DECK_COLORS[0])
              setEditingDeckId(null)
              setShowDeckForm(true)
            }}
            title="新建牌组"
          >
            +
          </button>
        </div>
      </div>

      {showDeckForm && (
        <div className={styles.deckFormOverlay} onClick={() => setShowDeckForm(false)}>
          <div className={styles.deckForm} onClick={e => e.stopPropagation()}>
            <h3 className={styles.formTitle}>{editingDeckId ? '编辑牌组' : '新建牌组'}</h3>
            <input
              className={styles.input}
              placeholder="牌组名称"
              value={deckName}
              onChange={e => setDeckName(e.target.value)}
              autoFocus
            />
            <div className={styles.deckFormSection}>
              <span className={styles.deckFormLabel}>图标</span>
              <div className={styles.iconGrid}>
                {DECK_ICONS.map(icon => (
                  <button
                    key={icon}
                    className={`${styles.iconOption} ${deckIcon === icon ? styles.iconOptionActive : ''}`}
                    onClick={() => setDeckIcon(icon)}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.deckFormSection}>
              <span className={styles.deckFormLabel}>颜色</span>
              <div className={styles.colorGrid}>
                {DECK_COLORS.map(color => (
                  <button
                    key={color}
                    className={`${styles.colorOption} ${deckColor === color ? styles.colorOptionActive : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setDeckColor(color)}
                  />
                ))}
              </div>
            </div>
            <div className={styles.formActions}>
              {editingDeckId && (
                <button
                  className={styles.deleteDeckButton}
                  onClick={() => {
                    handleDeleteDeck(editingDeckId)
                    setShowDeckForm(false)
                    setEditingDeckId(null)
                  }}
                >
                  删除牌组
                </button>
              )}
              <button className={styles.cancelButton} onClick={() => {
                setShowDeckForm(false)
                setEditingDeckId(null)
              }}>
                取消
              </button>
              <button
                className={styles.submitButton}
                onClick={editingDeckId ? handleUpdateDeck : handleCreateDeck}
                disabled={!deckName.trim()}
              >
                {editingDeckId ? '保存' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deckStats && !showStats && (
        <div className={styles.statsBar}>
          <div className={styles.statItem}>
            <span className={styles.statValue} style={{ color: activeDeck?.color || '#22c55e' }}>{deckStats.due}</span>
            <span className={styles.statLabel}>待复习</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <span className={styles.statValue} style={{ color: '#8b5cf6' }}>{deckStats.mastered}</span>
            <span className={styles.statLabel}>已掌握</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <span className={styles.statValue}>{deckStats.total}</span>
            <span className={styles.statLabel}>总计</span>
          </div>
        </div>
      )}

      {showStats && (
        <div className={styles.statsPanel}>
          <div className={styles.statsPanelHeader}>
            <span className={styles.statsPanelTitle}>📊 复习统计</span>
          </div>
          <div className={styles.statsOverview}>
            <div className={styles.statsCard}>
              <span className={styles.statsCardValue}>{reviewStats.todayReviewed}</span>
              <span className={styles.statsCardLabel}>今日复习</span>
            </div>
            <div className={styles.statsCard}>
              <span className={styles.statsCardValue}>🔥 {reviewStats.streak}</span>
              <span className={styles.statsCardLabel}>连续天数</span>
            </div>
            <div className={styles.statsCard}>
              <span className={styles.statsCardValue}>{reviewStats.masteryRate}%</span>
              <span className={styles.statsCardLabel}>掌握率</span>
            </div>
            <div className={styles.statsCard}>
              <span className={styles.statsCardValue}>{reviewStats.mastered}/{reviewStats.total}</span>
              <span className={styles.statsCardLabel}>已掌握/总计</span>
            </div>
          </div>
          {reviewStats.reviewLogs.length > 0 && (
            <div className={styles.statsChart}>
              <span className={styles.statsChartTitle}>近30天复习趋势</span>
              <div className={styles.statsChartBars}>
                {reviewStats.reviewLogs.map((log, i) => {
                  const maxCount = Math.max(...reviewStats.reviewLogs.map(l => l.count), 1)
                  const height = Math.max((log.count / maxCount) * 100, 4)
                  const dateLabel = log.date.slice(5)
                  return (
                    <div key={i} className={styles.statsChartBar} title={isMobile ? undefined : `${log.date}: ${log.count} 次`}>
                      <div
                        className={styles.statsChartBarFill}
                        style={{ height: `${height}%` }}
                      />
                      <span className={styles.statsChartBarLabel}>{dateLabel}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          {reviewStats.reviewLogs.length === 0 && (
            <div className={styles.statsEmpty}>
              <span>暂无复习记录，开始复习卡片吧！</span>
            </div>
          )}
        </div>
      )}

      {isSearching && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            搜索结果 ({searchResults.length})
          </h3>
          {searchResults.length > 0 ? (
            <div className={styles.list}>
              {searchResults.map(card => renderCard(card))}
            </div>
          ) : (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>🔍</span>
              <span className={styles.emptyText}>未找到匹配的卡片</span>
              <span className={styles.emptyHint}>尝试其他关键词</span>
            </div>
          )}
        </div>
      )}

      {!isSearching && dueCards.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            今日待复习 ({dueCards.length})
            {activeDeck && <span className={styles.sectionDeckHint}> · {activeDeck.name}</span>}
          </h3>
          <div className={styles.list}>
            {dueCards.map(card => renderCard(card))}
          </div>
        </div>
      )}

      {!isSearching && dueCards.length === 0 && state.cards.length > 0 && (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>🎉</span>
          <span className={styles.emptyText}>今日暂无待复习卡片</span>
          <span className={styles.emptyHint}>所有卡片都已按计划复习完毕</span>
        </div>
      )}

      {!isSearching && state.cards.length === 0 && (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>📝</span>
          <span className={styles.emptyText}>还没有记忆卡</span>
          <span className={styles.emptyHint}>创建你的第一张记忆卡开始学习吧</span>
        </div>
      )}

      <div className={styles.actions}>
        {!showAddForm && !showAIForm && (
          <>
            <button
              className={styles.addButton}
              onClick={() => setShowAddForm(true)}
              disabled={!state.activeDeckId}
            >
              + 手动添加卡片
            </button>
            <button
              className={styles.aiButton}
              onClick={() => setShowAIForm(true)}
              disabled={!hasAnyKey || !state.activeDeckId}
            >
              🤖 AI 提取卡片
            </button>
            {!hasAnyKey && (
              <span className={styles.aiHint}>配置 API Key 解锁 AI 提取</span>
            )}
            {!state.activeDeckId && state.decks.length === 0 && (
              <span className={styles.aiHint}>请先创建牌组</span>
            )}
          </>
        )}
      </div>

      {showAddForm && (
        <div className={styles.addForm}>
          <h3 className={styles.formTitle}>
            添加记忆卡
            {activeDeck && <span className={styles.formDeckHint}> · {activeDeck.icon} {activeDeck.name}</span>}
          </h3>
          <textarea
            className={styles.textarea}
            placeholder="正面：问题或概念"
            value={newFront}
            onChange={e => setNewFront(e.target.value)}
            rows={3}
          />
          <textarea
            className={styles.textarea}
            placeholder="背面：答案或解释"
            value={newBack}
            onChange={e => setNewBack(e.target.value)}
            rows={3}
          />
          <input
            className={styles.input}
            placeholder="标签（逗号分隔，如：数学,函数）"
            value={newTags}
            onChange={e => setNewTags(e.target.value)}
          />
          <div className={styles.formActions}>
            <button className={styles.cancelButton} onClick={() => setShowAddForm(false)}>
              取消
            </button>
            <button
              className={styles.submitButton}
              onClick={handleAdd}
              disabled={!newFront.trim() || !newBack.trim()}
            >
              添加
            </button>
          </div>
        </div>
      )}

      {showAIForm && (
        <div className={styles.addForm}>
          <h3 className={styles.formTitle}>
            AI 提取记忆卡
            {activeDeck && <span className={styles.formDeckHint}> · {activeDeck.icon} {activeDeck.name}</span>}
          </h3>
          <textarea
            className={styles.textarea}
            placeholder="粘贴一段课文、笔记或知识点内容，AI 将自动提取关键概念生成问答卡片..."
            value={aiInput}
            onChange={e => setAiInput(e.target.value)}
            rows={6}
          />
          <div className={styles.formActions}>
            <button className={styles.cancelButton} onClick={() => {
              setShowAIForm(false)
              setAiCards([])
              setAiError(null)
            }}>
              取消
            </button>
            <button
              className={styles.submitButton}
              onClick={handleAIExtract}
              disabled={!aiInput.trim() || aiLoading}
            >
              {aiLoading ? '提取中...' : '开始提取'}
            </button>
          </div>

          {aiLoading && (
            <div className={styles.aiLoading}>
              <span className={styles.spinner} />
              <span>AI 正在分析内容，提取关键概念...</span>
            </div>
          )}

          {aiError && (
            <span className={styles.aiError}>{aiError}</span>
          )}

          {aiCards.length > 0 && (
            <div className={styles.aiResult}>
              <div className={styles.aiResultHeader}>
                <span>提取到 {aiCards.length} 张卡片</span>
                <button
                  className={styles.selectAllButton}
                  onClick={() => {
                    if (selectedAiCards.size === aiCards.length) {
                      setSelectedAiCards(new Set())
                    } else {
                      setSelectedAiCards(new Set(aiCards.map((_, i) => i)))
                    }
                  }}
                >
                  {selectedAiCards.size === aiCards.length ? '取消全选' : '全选'}
                </button>
              </div>
              <div className={styles.aiCardList}>
                {aiCards.map((card, index) => (
                  <div
                    key={index}
                    className={`${styles.aiCard} ${selectedAiCards.has(index) ? styles.aiCardSelected : ''}`}
                    onClick={() => toggleAiCardSelection(index)}
                  >
                    <div className={styles.aiCardCheck}>
                      {selectedAiCards.has(index) ? '✓' : '○'}
                    </div>
                    <div className={styles.aiCardContent}>
                      <p className={styles.aiCardFront}><strong>Q:</strong> {card.front}</p>
                      <p className={styles.aiCardBack}><strong>A:</strong> {card.back}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button
                className={styles.importButton}
                onClick={handleImportSelected}
                disabled={selectedAiCards.size === 0}
              >
                导入选中卡片 ({selectedAiCards.size})
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
