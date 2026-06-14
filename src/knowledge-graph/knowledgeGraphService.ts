export interface GraphNode {
  id: string
  label: string
  type: 'journal' | 'reading' | 'quicknote' | 'goal' | 'habit' | 'tag' | 'mood' | 'persona'
  size: number
  brightness: number
  x?: number
  y?: number
  vx?: number
  vy?: number
  data?: Record<string, unknown>
}

export interface GraphEdge {
  source: string
  target: string
  strength: number
}

export interface KnowledgeGraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

const NODE_COLORS: Record<GraphNode['type'], string> = {
  journal: '#7C9EFF',
  reading: '#FF9F7C',
  quicknote: '#9FFF7C',
  goal: '#FF7C9F',
  habit: '#7CFFFF',
  tag: '#FFD700',
  mood: '#FF7CFF',
  persona: '#FFB347'
}

const NODE_SIZES: Record<GraphNode['type'], { min: number; max: number }> = {
  journal: { min: 20, max: 50 },
  reading: { min: 25, max: 55 },
  quicknote: { min: 15, max: 40 },
  goal: { min: 30, max: 60 },
  habit: { min: 18, max: 45 },
  tag: { min: 12, max: 35 },
  mood: { min: 20, max: 45 },
  persona: { min: 35, max: 70 }
}

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (raw) return JSON.parse(raw)
  } catch {
    // ignore parse errors
  }
  return fallback
}

function calculateNodeSize(type: GraphNode['type'], connectionCount: number): number {
  const { min, max } = NODE_SIZES[type]
  return Math.min(max, min + connectionCount * 3)
}

function calculateBrightness(connectionCount: number, maxConnections: number): number {
  if (maxConnections === 0) return 0.3
  return 0.3 + (connectionCount / maxConnections) * 0.7
}

export function buildKnowledgeGraph(): KnowledgeGraphData {
  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []
  const nodeMap = new Map<string, GraphNode>()
  const connectionCounts = new Map<string, number>()

  const journalState = loadFromStorage<{ entries?: { id: string; title?: string; tags?: string[]; mood?: string; date?: string }[] }>('xinghuanhai-journal-state', { entries: [] })
  const readingState = loadFromStorage<{ books?: { id: string; title: string; author?: string; category?: string }[] }>('xinghuanhai-reading-state', { books: [] })
  const quickNotesState = loadFromStorage<{ notes?: { id: string; content: string; tags: string[] }[] }>('xinghuanhai-quicknotes-state', { notes: [] })
  const goalsState = loadFromStorage<{ goals?: { id: string; title: string; parentId?: string; status?: string }[] }>('xinghuanhai-goals-state', { goals: [] })
  const habitsState = loadFromStorage<{ habits?: { id: string; name: string; category?: string }[] }>('xinghuanhai-habits-state', { habits: [] })
  const moodState = loadFromStorage<{ entries?: { id: string; mood: string; date: string }[] }>('xinghuanhai-mood-state', { entries: [] })

  const journalEntries = journalState.entries || []
  const readingBooks = readingState.books || []
  const quickNotes = quickNotesState.notes || []
  const goals = goalsState.goals || []
  const habits = habitsState.habits || []
  const moodEntries = moodState.entries || []

  journalEntries.forEach((entry) => {
    const nodeId = `journal-${entry.id}`
    const node: GraphNode = {
      id: nodeId,
      label: entry.title || entry.date || '日记',
      type: 'journal',
      size: NODE_SIZES.journal.min,
      brightness: 0.5,
      data: { date: entry.date, mood: entry.mood }
    }
    nodes.push(node)
    nodeMap.set(nodeId, node)
    connectionCounts.set(nodeId, 0)

    const entryTags = entry.tags || []
    entryTags.forEach(tag => {
      const tagId = `tag-${tag}`
      if (!nodeMap.has(tagId)) {
        const tagNode: GraphNode = {
          id: tagId,
          label: tag,
          type: 'tag',
          size: NODE_SIZES.tag.min,
          brightness: 0.4,
          data: { count: 1 }
        }
        nodes.push(tagNode)
        nodeMap.set(tagId, tagNode)
        connectionCounts.set(tagId, 0)
      }
      edges.push({ source: nodeId, target: tagId, strength: 0.8 })
      connectionCounts.set(nodeId, (connectionCounts.get(nodeId) || 0) + 1)
      connectionCounts.set(tagId, (connectionCounts.get(tagId) || 0) + 1)
    })
  })

  readingBooks.forEach(book => {
    const nodeId = `reading-${book.id}`
    const node: GraphNode = {
      id: nodeId,
      label: book.title,
      type: 'reading',
      size: NODE_SIZES.reading.min,
      brightness: 0.5,
      data: { author: book.author, category: book.category }
    }
    nodes.push(node)
    nodeMap.set(nodeId, node)
    connectionCounts.set(nodeId, 0)

    if (book.category) {
      const categoryId = `tag-${book.category}`
      if (!nodeMap.has(categoryId)) {
        const catNode: GraphNode = {
          id: categoryId,
          label: book.category,
          type: 'tag',
          size: NODE_SIZES.tag.min,
          brightness: 0.4
        }
        nodes.push(catNode)
        nodeMap.set(categoryId, catNode)
        connectionCounts.set(categoryId, 0)
      }
      edges.push({ source: nodeId, target: categoryId, strength: 0.7 })
      connectionCounts.set(nodeId, (connectionCounts.get(nodeId) || 0) + 1)
      connectionCounts.set(categoryId, (connectionCounts.get(categoryId) || 0) + 1)
    }
  })

  quickNotes.forEach(note => {
    const nodeId = `quicknote-${note.id}`
    const preview = note.content.slice(0, 20) + (note.content.length > 20 ? '...' : '')
    const node: GraphNode = {
      id: nodeId,
      label: preview,
      type: 'quicknote',
      size: NODE_SIZES.quicknote.min,
      brightness: 0.5,
      data: { fullContent: note.content }
    }
    nodes.push(node)
    nodeMap.set(nodeId, node)
    connectionCounts.set(nodeId, 0)

    const noteTags = note.tags || []
    noteTags.forEach(tag => {
      const tagId = `tag-${tag}`
      if (!nodeMap.has(tagId)) {
        const tagNode: GraphNode = {
          id: tagId,
          label: tag,
          type: 'tag',
          size: NODE_SIZES.tag.min,
          brightness: 0.4
        }
        nodes.push(tagNode)
        nodeMap.set(tagId, tagNode)
        connectionCounts.set(tagId, 0)
      }
      edges.push({ source: nodeId, target: tagId, strength: 0.9 })
      connectionCounts.set(nodeId, (connectionCounts.get(nodeId) || 0) + 1)
      connectionCounts.set(tagId, (connectionCounts.get(tagId) || 0) + 1)
    })
  })

  goals.forEach(goal => {
    const nodeId = `goal-${goal.id}`
    const node: GraphNode = {
      id: nodeId,
      label: goal.title,
      type: 'goal',
      size: NODE_SIZES.goal.min,
      brightness: 0.5,
      data: { status: goal.status }
    }
    nodes.push(node)
    nodeMap.set(nodeId, node)
    connectionCounts.set(nodeId, 0)

    if (goal.parentId) {
      const parentId = `goal-${goal.parentId}`
      if (nodeMap.has(parentId)) {
        edges.push({ source: parentId, target: nodeId, strength: 0.9 })
        connectionCounts.set(nodeId, (connectionCounts.get(nodeId) || 0) + 1)
        connectionCounts.set(parentId, (connectionCounts.get(parentId) || 0) + 1)
      }
    }
  })

  habits.forEach(habit => {
    const nodeId = `habit-${habit.id}`
    const node: GraphNode = {
      id: nodeId,
      label: habit.name,
      type: 'habit',
      size: NODE_SIZES.habit.min,
      brightness: 0.5,
      data: { category: habit.category }
    }
    nodes.push(node)
    nodeMap.set(nodeId, node)
    connectionCounts.set(nodeId, 0)

    if (habit.category) {
      const catId = `tag-${habit.category}`
      if (!nodeMap.has(catId)) {
        const catNode: GraphNode = {
          id: catId,
          label: habit.category,
          type: 'tag',
          size: NODE_SIZES.tag.min,
          brightness: 0.4
        }
        nodes.push(catNode)
        nodeMap.set(catId, catNode)
        connectionCounts.set(catId, 0)
      }
      edges.push({ source: nodeId, target: catId, strength: 0.6 })
      connectionCounts.set(nodeId, (connectionCounts.get(nodeId) || 0) + 1)
      connectionCounts.set(catId, (connectionCounts.get(catId) || 0) + 1)
    }
  })

  const moodCounts = new Map<string, number>()
  moodEntries.forEach(entry => {
    moodCounts.set(entry.mood, (moodCounts.get(entry.mood) || 0) + 1)
  })
  moodCounts.forEach((count, mood) => {
    const nodeId = `mood-${mood}`
    const moodLabels: Record<string, string> = {
      great: '太棒了',
      good: '不错',
      neutral: '一般',
      bad: '不太好',
      terrible: '很糟糕'
    }
    const node: GraphNode = {
      id: nodeId,
      label: moodLabels[mood] || mood,
      type: 'mood',
      size: NODE_SIZES.mood.min + count * 2,
      brightness: 0.5,
      data: { count }
    }
    nodes.push(node)
    nodeMap.set(nodeId, node)
  })

  const maxConnections = Math.max(...Array.from(connectionCounts.values()), 1)
  nodes.forEach(node => {
    const connections = connectionCounts.get(node.id) || 0
    node.size = calculateNodeSize(node.type, connections)
    node.brightness = calculateBrightness(connections, maxConnections)
  })

  return { nodes, edges }
}

export function getNodeColor(type: GraphNode['type']): string {
  return NODE_COLORS[type] || '#888888'
}

export function initializeNodePositions(
  nodes: GraphNode[],
  width: number,
  height: number
): GraphNode[] {
  const centerX = width / 2
  const centerY = height / 2
  const radius = Math.min(width, height) * 0.35

  nodes.forEach((node, index) => {
    const angle = (2 * Math.PI * index) / nodes.length
    const r = radius * (0.3 + Math.random() * 0.7)
    node.x = centerX + r * Math.cos(angle)
    node.y = centerY + r * Math.sin(angle)
    node.vx = (Math.random() - 0.5) * 0.5
    node.vy = (Math.random() - 0.5) * 0.5
  })

  return nodes
}

export function simulateForces(
  nodes: GraphNode[],
  edges: GraphEdge[],
  iterations: number = 100
): GraphNode[] {
  const repulsionStrength = 5000
  const attractionStrength = 0.01
  const damping = 0.9

  for (let i = 0; i < iterations; i++) {
    nodes.forEach(node => {
      if (node.x === undefined || node.y === undefined) return

      let fx = 0
      let fy = 0

      nodes.forEach(other => {
        if (other.id === node.id || other.x === undefined || other.y === undefined) return
        const dx = node.x - other.x
        const dy = node.y - other.y
        const dist = Math.sqrt(dx * dx + dy * dy) + 0.1
        const force = repulsionStrength / (dist * dist)
        fx += (dx / dist) * force
        fy += (dy / dist) * force
      })

      edges.forEach(edge => {
        let other: GraphNode | undefined
        if (edge.source === node.id) {
          other = nodes.find(n => n.id === edge.target)
        } else if (edge.target === node.id) {
          other = nodes.find(n => n.id === edge.source)
        }
        if (other && other.x !== undefined && other.y !== undefined) {
          const dx = other.x - node.x
          const dy = other.y - node.y
          const dist = Math.sqrt(dx * dx + dy * dy) + 0.1
          const force = attractionStrength * edge.strength * dist
          fx += (dx / dist) * force
          fy += (dy / dist) * force
        }
      })

      if (node.vx !== undefined && node.vy !== undefined) {
        node.vx = (node.vx + fx) * damping
        node.vy = (node.vy + fy) * damping
        node.x += node.vx
        node.y += node.vy
      }
    })
  }

  return nodes
}
