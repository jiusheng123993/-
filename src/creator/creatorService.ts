export interface IdeaItem {
  id: string
  title: string
  source: string
  tags: string[]
  createdAt: string
  status: 'new' | 'developing' | 'archived'
}

export interface ContentPiece {
  id: string
  title: string
  stage: 'outline' | 'draft' | 'editing' | 'review' | 'publish'
  platform: string
  deadline: string
  progress: number
  ideaId?: string
}

export interface PublishEvent {
  id: string
  title: string
  platform: string
  scheduledDate: string
  status: 'planned' | 'published' | 'delayed'
  contentPieceId?: string
}

export interface ClientProject {
  id: string
  clientName: string
  description: string
  status: 'inquiry' | 'proposal' | 'in-progress' | 'feedback' | 'delivered'
  deadline: string
  budget: number
  paidAmount: number
}

export interface CreatorService {
  getIdeas(): IdeaItem[]
  addIdea(title: string, source: string, tags: string[]): IdeaItem
  updateIdeaStatus(id: string, status: IdeaItem['status']): void
  removeIdea(id: string): void
  getContentPieces(): ContentPiece[]
  addContentPiece(title: string, platform: string, deadline: string, ideaId?: string): ContentPiece
  updateContentProgress(id: string, progress: number): void
  updateContentStage(id: string, stage: ContentPiece['stage']): void
  removeContentPiece(id: string): void
  getPublishEvents(): PublishEvent[]
  addPublishEvent(title: string, platform: string, scheduledDate: string, contentPieceId?: string): PublishEvent
  markPublished(id: string): void
  removePublishEvent(id: string): void
  getClientProjects(): ClientProject[]
  addClientProject(clientName: string, description: string, deadline: string, budget: number): ClientProject
  updateClientStatus(id: string, status: ClientProject['status']): void
  removeClientProject(id: string): void
  getSummary(): {
    ideaCount: number
    activeContentCount: number
    upcomingPublishCount: number
    activeClientCount: number
    totalBudget: number
    totalPaid: number
  }
}

const DEFAULT_STORE_KEY = 'creator-workbench'

function load<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function save<T>(key: string, items: T[]): void {
  localStorage.setItem(key, JSON.stringify(items))
}

export function createCreatorService(storeKey: string = DEFAULT_STORE_KEY): CreatorService {
  const ideasKey = `${storeKey}-ideas`
  const contentKey = `${storeKey}-content`
  const publishKey = `${storeKey}-publish`
  const clientsKey = `${storeKey}-clients`

  return {
    getIdeas(): IdeaItem[] {
      return load<IdeaItem>(ideasKey)
    },

    addIdea(title: string, source: string, tags: string[]): IdeaItem {
      const ideas = load<IdeaItem>(ideasKey)
      const idea: IdeaItem = {
        id: crypto.randomUUID(),
        title,
        source,
        tags,
        createdAt: new Date().toISOString(),
        status: 'new'
      }
      ideas.push(idea)
      save(ideasKey, ideas)
      return idea
    },

    updateIdeaStatus(id: string, status: IdeaItem['status']): void {
      const ideas = load<IdeaItem>(ideasKey)
      const idx = ideas.findIndex(i => i.id === id)
      if (idx === -1) return
      ideas[idx] = { ...ideas[idx], status }
      save(ideasKey, ideas)
    },

    removeIdea(id: string): void {
      const ideas = load<IdeaItem>(ideasKey)
      save(ideasKey, ideas.filter(i => i.id !== id))
    },

    getContentPieces(): ContentPiece[] {
      return load<ContentPiece>(contentKey)
    },

    addContentPiece(title: string, platform: string, deadline: string, ideaId?: string): ContentPiece {
      const pieces = load<ContentPiece>(contentKey)
      const piece: ContentPiece = {
        id: crypto.randomUUID(),
        title,
        stage: 'outline',
        platform,
        deadline,
        progress: 0,
        ...(ideaId ? { ideaId } : {})
      }
      pieces.push(piece)
      save(contentKey, pieces)
      return piece
    },

    updateContentProgress(id: string, progress: number): void {
      const pieces = load<ContentPiece>(contentKey)
      const idx = pieces.findIndex(p => p.id === id)
      if (idx === -1) return
      pieces[idx] = { ...pieces[idx], progress: Math.max(0, Math.min(100, progress)) }
      save(contentKey, pieces)
    },

    updateContentStage(id: string, stage: ContentPiece['stage']): void {
      const pieces = load<ContentPiece>(contentKey)
      const idx = pieces.findIndex(p => p.id === id)
      if (idx === -1) return
      pieces[idx] = { ...pieces[idx], stage }
      save(contentKey, pieces)
    },

    removeContentPiece(id: string): void {
      const pieces = load<ContentPiece>(contentKey)
      save(contentKey, pieces.filter(p => p.id !== id))
    },

    getPublishEvents(): PublishEvent[] {
      return load<PublishEvent>(publishKey)
    },

    addPublishEvent(title: string, platform: string, scheduledDate: string, contentPieceId?: string): PublishEvent {
      const events = load<PublishEvent>(publishKey)
      const event: PublishEvent = {
        id: crypto.randomUUID(),
        title,
        platform,
        scheduledDate,
        status: 'planned',
        ...(contentPieceId ? { contentPieceId } : {})
      }
      events.push(event)
      save(publishKey, events)
      return event
    },

    markPublished(id: string): void {
      const events = load<PublishEvent>(publishKey)
      const idx = events.findIndex(e => e.id === id)
      if (idx === -1) return
      events[idx] = { ...events[idx], status: 'published' }
      save(publishKey, events)
    },

    removePublishEvent(id: string): void {
      const events = load<PublishEvent>(publishKey)
      save(publishKey, events.filter(e => e.id !== id))
    },

    getClientProjects(): ClientProject[] {
      return load<ClientProject>(clientsKey)
    },

    addClientProject(clientName: string, description: string, deadline: string, budget: number): ClientProject {
      const projects = load<ClientProject>(clientsKey)
      const project: ClientProject = {
        id: crypto.randomUUID(),
        clientName,
        description,
        status: 'inquiry',
        deadline,
        budget,
        paidAmount: 0
      }
      projects.push(project)
      save(clientsKey, projects)
      return project
    },

    updateClientStatus(id: string, status: ClientProject['status']): void {
      const projects = load<ClientProject>(clientsKey)
      const idx = projects.findIndex(p => p.id === id)
      if (idx === -1) return
      projects[idx] = { ...projects[idx], status }
      save(clientsKey, projects)
    },

    removeClientProject(id: string): void {
      const projects = load<ClientProject>(clientsKey)
      save(clientsKey, projects.filter(p => p.id !== id))
    },

    getSummary() {
      const ideas = load<IdeaItem>(ideasKey)
      const pieces = load<ContentPiece>(contentKey)
      const events = load<PublishEvent>(publishKey)
      const projects = load<ClientProject>(clientsKey)

      const now = new Date().toISOString().slice(0, 10)

      return {
        ideaCount: ideas.length,
        activeContentCount: pieces.filter(p => p.stage !== 'publish').length,
        upcomingPublishCount: events.filter(e => e.status === 'planned' && e.scheduledDate >= now).length,
        activeClientCount: projects.filter(p => p.status !== 'delivered').length,
        totalBudget: projects.reduce((sum, p) => sum + p.budget, 0),
        totalPaid: projects.reduce((sum, p) => sum + p.paidAmount, 0)
      }
    }
  }
}
