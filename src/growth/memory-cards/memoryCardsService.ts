import { calculateNextReview } from './spacedRepetition'
import { createStorageService } from '../../shared/data/storageFactory'

export interface Deck {
  id: string
  name: string
  icon: string
  color: string
  createdAt: string
}

export interface MemoryCard {
  id: string
  deckId: string
  front: string
  back: string
  tags: string[]
  interval: number
  easeFactor: number
  reviewCount: number
  nextDueDate: string
  createdAt: string
  lastReviewedAt: string | null
}

export interface MemoryCardsState {
  decks: Deck[]
  cards: MemoryCard[]
  activeDeckId: string | null
}

const STORAGE_KEY = 'xinghuanhai-memorycards-state'
const DEFAULT_DECK_ID = 'deck-default'

const DECK_ICONS = ['📝', '📚', '🧮', '🌍', '💻', '🔬', '🗣️', '🎨', '🏃', '💼', '🎵', '📖', '⚡', '🌟', '🔥', '❤️']

const DECK_COLORS = [
  '#22c55e', '#3b82f6', '#ef4444', '#8b5cf6',
  '#f59e0b', '#ec4899', '#06b6d4', '#84cc16'
]

function generateId(): string {
  return `mc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function generateDeckId(): string {
  return `deck-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

export { DECK_ICONS, DECK_COLORS }

function migrateState(raw: unknown): MemoryCardsState {
  if (!raw || typeof raw !== 'object') {
    return { decks: [], cards: [], activeDeckId: null }
  }

  const obj = raw as Record<string, unknown>

  if (Array.isArray(obj.decks)) {
    const state = obj as unknown as MemoryCardsState
    if (!state.activeDeckId && state.decks.length > 0) {
      state.activeDeckId = state.decks[0].id
    }
    return state
  }

  const oldCards = (Array.isArray(obj.cards) ? obj.cards : []) as unknown as Array<MemoryCard & { deckId?: string }>

  const defaultDeck: Deck = {
    id: DEFAULT_DECK_ID,
    name: '默认',
    icon: '📝',
    color: '#22c55e',
    createdAt: new Date().toISOString()
  }

  const migratedCards: MemoryCard[] = oldCards.map(card => ({
    ...card,
    deckId: card.deckId || DEFAULT_DECK_ID
  }))

  return {
    decks: [defaultDeck],
    cards: migratedCards,
    activeDeckId: DEFAULT_DECK_ID
  }
}

function makeDefaultState(): MemoryCardsState {
  const defaultDeck: Deck = {
    id: DEFAULT_DECK_ID,
    name: '默认',
    icon: '📝',
    color: '#22c55e',
    createdAt: new Date().toISOString()
  }
  return { decks: [defaultDeck], cards: [], activeDeckId: DEFAULT_DECK_ID }
}

const storage = createStorageService<MemoryCardsState>(
  STORAGE_KEY,
  makeDefaultState(),
  migrateState
)

export function loadState(): MemoryCardsState {
  return storage.load()
}

export function saveState(state: MemoryCardsState): void {
  storage.save(state)
}

export function createDeck(state: MemoryCardsState, name: string, icon: string, color: string): MemoryCardsState {
  const deck: Deck = {
    id: generateDeckId(),
    name: name.trim(),
    icon,
    color,
    createdAt: new Date().toISOString()
  }
  return {
    ...state,
    decks: [...state.decks, deck],
    activeDeckId: deck.id
  }
}

export function updateDeck(state: MemoryCardsState, deckId: string, updates: Partial<Pick<Deck, 'name' | 'icon' | 'color'>>): MemoryCardsState {
  return {
    ...state,
    decks: state.decks.map(d => d.id === deckId ? { ...d, ...updates } : d)
  }
}

export function deleteDeck(state: MemoryCardsState, deckId: string): MemoryCardsState {
  const remainingDecks = state.decks.filter(d => d.id !== deckId)
  const remainingCards = state.cards.filter(c => c.deckId !== deckId)
  let activeDeckId = state.activeDeckId
  if (activeDeckId === deckId) {
    activeDeckId = remainingDecks.length > 0 ? remainingDecks[0].id : null
  }
  return { decks: remainingDecks, cards: remainingCards, activeDeckId }
}

export function setActiveDeck(state: MemoryCardsState, deckId: string | null): MemoryCardsState {
  return { ...state, activeDeckId: deckId }
}

export function addCard(
  state: MemoryCardsState,
  deckId: string,
  front: string,
  back: string,
  tags: string[]
): MemoryCardsState {
  const now = new Date().toISOString()
  const card: MemoryCard = {
    id: generateId(),
    deckId,
    front: front.trim(),
    back: back.trim(),
    tags,
    interval: 1,
    easeFactor: 2.5,
    reviewCount: 0,
    nextDueDate: now,
    createdAt: now,
    lastReviewedAt: null
  }
  return { ...state, cards: [...state.cards, card] }
}

export function deleteCard(state: MemoryCardsState, cardId: string): MemoryCardsState {
  return { ...state, cards: state.cards.filter(c => c.id !== cardId) }
}

export function updateCard(
  state: MemoryCardsState,
  cardId: string,
  updates: Partial<Pick<MemoryCard, 'front' | 'back' | 'tags'>>
): MemoryCardsState {
  return {
    ...state,
    cards: state.cards.map(c => c.id === cardId ? { ...c, ...updates } : c)
  }
}

export interface ReviewLogEntry {
  date: string
  count: number
}

export function getReviewStats(state: MemoryCardsState) {
  const now = new Date()
  const total = state.cards.length
  const mastered = state.cards.filter(c => c.reviewCount >= 3 && c.interval >= 21).length
  const masteryRate = total > 0 ? Math.round((mastered / total) * 100) : 0

  const reviewLogs: ReviewLogEntry[] = []
  const reviewMap = new Map<string, number>()

  for (const card of state.cards) {
    if (card.lastReviewedAt) {
      const dateKey = card.lastReviewedAt.slice(0, 10)
      reviewMap.set(dateKey, (reviewMap.get(dateKey) || 0) + 1)
    }
  }

  const sortedDates = Array.from(reviewMap.keys()).sort()
  for (const date of sortedDates) {
    reviewLogs.push({ date, count: reviewMap.get(date)! })
  }

  const today = now.toISOString().slice(0, 10)
  const todayReviewed = reviewMap.get(today) || 0

  let streak = 0
  const checkDate = new Date(now)
  for (let i = 0; i < 365; i++) {
    const dateKey = checkDate.toISOString().slice(0, 10)
    if (reviewMap.has(dateKey)) {
      streak++
      checkDate.setDate(checkDate.getDate() - 1)
    } else if (dateKey === today) {
      checkDate.setDate(checkDate.getDate() - 1)
      continue
    } else {
      break
    }
  }

  return {
    total,
    mastered,
    masteryRate,
    todayReviewed,
    streak,
    reviewLogs: reviewLogs.slice(-30)
  }
}

export function searchCards(state: MemoryCardsState, query: string): MemoryCard[] {
  if (!query.trim()) return []
  const q = query.trim().toLowerCase()
  return state.cards.filter(c =>
    c.front.toLowerCase().includes(q) ||
    c.back.toLowerCase().includes(q) ||
    c.tags.some(t => t.toLowerCase().includes(q))
  )
}

export function reviewCard(
  state: MemoryCardsState,
  cardId: string,
  quality: 0 | 1 | 2 | 3 | 4 | 5
): MemoryCardsState {
  return {
    ...state,
    cards: state.cards.map(card => {
      if (card.id !== cardId) return card
      const result = calculateNextReview(card, quality)
      return {
        ...card,
        interval: result.nextInterval,
        easeFactor: result.easeFactor,
        reviewCount: card.reviewCount + 1,
        nextDueDate: result.nextDueDate,
        lastReviewedAt: new Date().toISOString()
      }
    })
  }
}

export function getCardsByDeck(state: MemoryCardsState, deckId: string): MemoryCard[] {
  return state.cards.filter(c => c.deckId === deckId)
}

export function getDueCards(state: MemoryCardsState, deckId?: string | null): MemoryCard[] {
  const now = new Date()
  const pool = deckId ? state.cards.filter(c => c.deckId === deckId) : state.cards
  return pool
    .filter(card => new Date(card.nextDueDate) <= now)
    .sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime())
}

export function getMasteredCards(state: MemoryCardsState, deckId?: string | null): MemoryCard[] {
  const pool = deckId ? state.cards.filter(c => c.deckId === deckId) : state.cards
  return pool.filter(card => card.reviewCount >= 3 && card.interval >= 21)
}

export function getDeckStats(state: MemoryCardsState, deckId: string) {
  const cards = getCardsByDeck(state, deckId)
  const now = new Date()
  const due = cards.filter(c => new Date(c.nextDueDate) <= now)
  const mastered = cards.filter(c => c.reviewCount >= 3 && c.interval >= 21)
  return {
    total: cards.length,
    due: due.length,
    mastered: mastered.length
  }
}

export function getGlobalStats(state: MemoryCardsState) {
  const now = new Date()
  const due = state.cards.filter(c => new Date(c.nextDueDate) <= now)
  const mastered = state.cards.filter(c => c.reviewCount >= 3 && c.interval >= 21)
  return {
    deckCount: state.decks.length,
    total: state.cards.length,
    due: due.length,
    mastered: mastered.length
  }
}