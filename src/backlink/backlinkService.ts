export interface Backlink {
  id: string
  sourceId: string
  sourceType: 'journal' | 'quicknote' | 'goal' | 'habit' | 'reading' | 'project' | 'wellness' | 'mood' | 'english' | 'creator'
  sourceTitle: string
  sourcePreview: string
  targetTitle: string
  context: string
  createdAt: string
}

export interface UnlinkedMention {
  sourceId: string
  sourceType: Backlink['sourceType']
  sourceTitle: string
  sourcePreview: string
  mentionedTitle: string
  context: string
}

export interface BacklinkIndex {
  forwardLinks: Map<string, Backlink[]>
  backlinks: Map<string, Backlink[]>
  unlinkedMentions: UnlinkedMention[]
}

export interface BacklinkState {
  links: Backlink[]
  lastIndexedAt: string | null
}

const STORAGE_KEY = 'xinghuanhai-backlink-state'

function loadState(): BacklinkState {
  if (typeof window === 'undefined') return { links: [], lastIndexedAt: null }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // ignore parse errors
  }
  return { links: [], lastIndexedAt: null }
}

function saveState(state: BacklinkState): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

const LINK_PATTERN = /\[\[([^\]]+)\]\]/g

function extractLinks(text: string): { title: string; position: number }[] {
  const links: { title: string; position: number }[] = []
  let match: RegExpExecArray | null
  LINK_PATTERN.lastIndex = 0
  while ((match = LINK_PATTERN.exec(text)) !== null) {
    links.push({
      title: match[1].trim(),
      position: match.index
    })
  }
  return links
}

function getContextAround(text: string, position: number, radius: number = 40): string {
  const start = Math.max(0, position - radius)
  const end = Math.min(text.length, position + radius + 2)
  let context = text.slice(start, end)
  if (start > 0) context = '...' + context
  if (end < text.length) context = context + '...'
  return context
}

function getPreview(text: string, maxLength: number = 80): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

interface SourceEntry {
  id: string
  title: string
  content: string
  tags?: string[]
  type: Backlink['sourceType']
}

function collectAllSources(): SourceEntry[] {
  const sources: SourceEntry[] = []

  const journalRaw = window.localStorage.getItem('xinghuanhai-journal-state')
  if (journalRaw) {
    try {
      const data = JSON.parse(journalRaw)
      const entries = data.entries || []
      entries.forEach((e: { id: string; title?: string; content?: string; tags?: string[] }) => {
        sources.push({
          id: e.id,
          title: e.title || '日记',
          content: e.content || '',
          tags: e.tags,
          type: 'journal'
        })
      })
    } catch {
      // ignore parse errors
    }
  }

  const quickNotesRaw = window.localStorage.getItem('xinghuanhai-quicknotes-state')
  if (quickNotesRaw) {
    try {
      const data = JSON.parse(quickNotesRaw)
      const notes = data.notes || []
      notes.forEach((n: { id: string; content: string; tags?: string[] }) => {
        sources.push({
          id: n.id,
          title: getPreview(n.content, 30),
          content: n.content,
          tags: n.tags,
          type: 'quicknote'
        })
      })
    } catch {
      // ignore parse errors
    }
  }

  const goalsRaw = window.localStorage.getItem('xinghuanhai-goals-state')
  if (goalsRaw) {
    try {
      const data = JSON.parse(goalsRaw)
      const goals = data.goals || []
      goals.forEach((g: { id: string; title: string; description?: string; tags?: string[] }) => {
        sources.push({
          id: g.id,
          title: g.title,
          content: g.description || '',
          tags: g.tags,
          type: 'goal'
        })
      })
    } catch {
      // ignore parse errors
    }
  }

  const habitsRaw = window.localStorage.getItem('xinghuanhai-habits-state')
  if (habitsRaw) {
    try {
      const data = JSON.parse(habitsRaw)
      const habits = data.habits || []
      habits.forEach((h: { id: string; name: string; description?: string; category?: string }) => {
        sources.push({
          id: h.id,
          title: h.name,
          content: h.description || '',
          tags: h.category ? [h.category] : [],
          type: 'habit'
        })
      })
    } catch {
      // ignore parse errors
    }
  }

  const readingRaw = window.localStorage.getItem('xinghuanhai-reading-state')
  if (readingRaw) {
    try {
      const data = JSON.parse(readingRaw)
      const books = data.books || []
      books.forEach((b: { id: string; title: string; notes?: string; category?: string }) => {
        sources.push({
          id: b.id,
          title: b.title,
          content: b.notes || '',
          tags: b.category ? [b.category] : [],
          type: 'reading'
        })
      })
    } catch {
      // ignore parse errors
    }
  }

  const projectRaw = window.localStorage.getItem('xinghuanhai-project-state')
  if (projectRaw) {
    try {
      const data = JSON.parse(projectRaw)
      const projects = data.projects || []
      projects.forEach((p: { id: string; name: string; description?: string; tags?: string[] }) => {
        sources.push({
          id: p.id,
          title: p.name,
          content: p.description || '',
          tags: p.tags,
          type: 'project'
        })
      })
    } catch {
      // ignore parse errors
    }
  }

  return sources
}

function collectAllTitles(sources: SourceEntry[]): Set<string> {
  const titles = new Set<string>()
  sources.forEach(s => {
    if (s.title) titles.add(s.title)
    if (s.tags) {
      s.tags.forEach(tag => titles.add(tag))
    }
  })
  return titles
}

export function rebuildIndex(): BacklinkState {
  const sources = collectAllSources()
  const links: Backlink[] = []
  const now = new Date().toISOString()

  sources.forEach(source => {
    const foundLinks = extractLinks(source.content)
    foundLinks.forEach(link => {
      links.push({
        id: `bl-${source.id}-${link.title}`,
        sourceId: source.id,
        sourceType: source.type,
        sourceTitle: source.title,
        sourcePreview: getPreview(source.content),
        targetTitle: link.title,
        context: getContextAround(source.content, link.position),
        createdAt: now
      })
    })
  })

  const state: BacklinkState = {
    links,
    lastIndexedAt: now
  }

  saveState(state)
  return state
}

export function getBacklinksFor(targetTitle: string): Backlink[] {
  const state = loadState()
  return state.links.filter(l => l.targetTitle === targetTitle)
}

export function getForwardLinksFor(sourceId: string): Backlink[] {
  const state = loadState()
  return state.links.filter(l => l.sourceId === sourceId)
}

export function findUnlinkedMentions(): UnlinkedMention[] {
  const sources = collectAllSources()
  const allTitles = collectAllTitles(sources)
  const state = loadState()
  const mentions: UnlinkedMention[] = []

  const existingLinks = new Set<string>()
  state.links.forEach(l => {
    existingLinks.add(`${l.sourceId}-${l.targetTitle}`)
  })

  sources.forEach(source => {
    allTitles.forEach(title => {
      if (title.length < 2) return
      if (title === source.title) return
      const key = `${source.id}-${title}`
      if (existingLinks.has(key)) return

      const idx = source.content.indexOf(title)
      if (idx === -1) return

      const linkPattern = new RegExp(`\\[\\[${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]\\]`)
      if (linkPattern.test(source.content)) return

      mentions.push({
        sourceId: source.id,
        sourceType: source.type,
        sourceTitle: source.title,
        sourcePreview: getPreview(source.content),
        mentionedTitle: title,
        context: getContextAround(source.content, idx)
      })
    })
  })

  return mentions
}

export function getBacklinkStats(): {
  totalLinks: number
  totalSources: number
  totalTargets: number
  unlinkedCount: number
} {
  const state = loadState()
  const sources = new Set(state.links.map(l => l.sourceId))
  const targets = new Set(state.links.map(l => l.targetTitle))
  const unlinked = findUnlinkedMentions()

  return {
    totalLinks: state.links.length,
    totalSources: sources.size,
    totalTargets: targets.size,
    unlinkedCount: unlinked.length
  }
}

export function getLinkedTargets(): { title: string; count: number }[] {
  const state = loadState()
  const countMap = new Map<string, number>()
  state.links.forEach(l => {
    countMap.set(l.targetTitle, (countMap.get(l.targetTitle) || 0) + 1)
  })
  return Array.from(countMap.entries())
    .map(([title, count]) => ({ title, count }))
    .sort((a, b) => b.count - a.count)
}

export function getSourceTypeLabel(type: Backlink['sourceType']): string {
  const labels: Record<Backlink['sourceType'], string> = {
    journal: '日记',
    quicknote: '速记',
    goal: '目标',
    habit: '习惯',
    reading: '阅读',
    project: '项目',
    wellness: '健康',
    mood: '心情',
    english: '英语',
    creator: '创作'
  }
  return labels[type] || type
}

export function getSourceTypeIcon(type: Backlink['sourceType']): string {
  const icons: Record<Backlink['sourceType'], string> = {
    journal: '📔',
    quicknote: '📝',
    goal: '🎯',
    habit: '✅',
    reading: '📚',
    project: '📋',
    wellness: '💪',
    mood: '😊',
    english: '🔤',
    creator: '🎨'
  }
  return icons[type] || '📄'
}

export function getState(): BacklinkState {
  return loadState()
}

export function clearLinks(): void {
  saveState({ links: [], lastIndexedAt: null })
}