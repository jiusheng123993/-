import type { CustomPersona, CustomPersonaInput } from '../customPersona'
import type { PersonaSafetyGate } from '../personaSafetyGate'

export type CommunityReportReason =
  | 'inappropriate_persona'
  | 'inappropriate_dialogue'
  | 'plagiarism'
  | 'impersonation'
  | 'other'

export type CommunityReviewStatus = 'pending' | 'approved' | 'rejected' | 'removed'

export type CommunitySortMode = 'hot' | 'new' | 'top_rated'

export type CommunityPersonaEntry = {
  id: string
  sourcePersonaId: string
  creatorUserId: string
  creatorDisplayName: string
  visibility: 'public' | 'unlisted'
  reviewStatus: CommunityReviewStatus
  importCount: number
  ratingAverage: number
  ratingCount: number
  reportCount: number
  publishedAt: string
  lastImportedAt?: string
}

export type CommunityReport = {
  id: string
  entryId: string
  reporterUserId: string
  reason: CommunityReportReason
  description?: string
  createdAt: string
  resolved: boolean
}

export type CommunityRating = {
  userId: string
  entryId: string
  score: 1 | 2 | 3 | 4 | 5
  createdAt: string
}

export type CreatorPenalty = {
  userId: string
  strikeCount: number
  banned: boolean
  bannedAt?: string
}

export interface CommunityPersonaServiceConfig {
  safetyGate: PersonaSafetyGate
  getCustomPersonaById: (id: string) => CustomPersona | undefined
  getCustomPersonasByUser: (userId: string) => CustomPersona[]
  addCustomPersona: (input: CustomPersonaInput) => CustomPersona
}

export interface ICommunityPersonaService {
  publish(userId: string, personaId: string, visibility: 'public' | 'unlisted'): Promise<{ ok: boolean; entryId?: string; rejectedReasons?: string[] }>
  unpublish(userId: string, entryId: string): Promise<{ ok: boolean; reason?: string }>
  list(filter?: { sort?: CommunitySortMode; search?: string; limit?: number; offset?: number }): Promise<CommunityPersonaEntry[]>
  getById(entryId: string): CommunityPersonaEntry | undefined
  importToMy(userId: string, entryId: string): Promise<{ ok: boolean; createdPersonaId?: string; reason?: string }>
  report(userId: string, entryId: string, reason: CommunityReportReason, description?: string): Promise<{ ok: boolean; reason?: string }>
  rate(userId: string, entryId: string, score: 1 | 2 | 3 | 4 | 5): Promise<{ ok: boolean; reason?: string }>
  getReports(entryId: string): CommunityReport[]
  getRatings(entryId: string): CommunityRating[]
  getUserRating(userId: string, entryId: string): CommunityRating | undefined
  getCreatorPenalty(userId: string): CreatorPenalty
  search(query: string): Promise<CommunityPersonaEntry[]>
}

const ENTRIES_STORAGE_KEY = 'xinghuanhai_community_entries'
const REPORTS_STORAGE_KEY = 'xinghuanhai_community_reports'
const RATINGS_STORAGE_KEY = 'xinghuanhai_community_ratings'
const PENALTIES_STORAGE_KEY = 'xinghuanhai_community_penalties'

const MAX_BAN_STRIKES = 3

function generateId(): string {
  return `comm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

function loadFromStorage<T>(key: string): T[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = window.localStorage.getItem(key)
    if (!stored) return []
    const parsed = JSON.parse(stored) as T[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveToStorage<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, JSON.stringify(data))
}

function validatePersonaForPublish(
  persona: CustomPersona,
  safetyGate: PersonaSafetyGate
): string[] {
  const reasons: string[] = []

  const nameCheck = safetyGate.validateName(persona.name)
  if (!nameCheck.ok && nameCheck.reason) {
    reasons.push(nameCheck.reason)
  }

  const contentCheck = safetyGate.validateContent(
    `${persona.targetUser} ${persona.painPoint} ${persona.primaryFlow} ${persona.hero} ${persona.aiRole}`
  )
  if (!contentCheck.ok && contentCheck.reason) {
    reasons.push(contentCheck.reason)
  }

  return reasons
}

function computeHotScore(entry: CommunityPersonaEntry): number {
  const ageHours = (Date.now() - new Date(entry.publishedAt).getTime()) / (1000 * 60 * 60)
  const gravity = 1.8
  return (entry.importCount * 2 + entry.ratingCount * 1.5 + entry.ratingAverage * 3) / Math.pow(ageHours + 2, gravity)
}

export function createCommunityPersonaService(config: CommunityPersonaServiceConfig): ICommunityPersonaService {
  const { safetyGate, getCustomPersonaById, getCustomPersonasByUser, addCustomPersona } = config

  function getEntries(): CommunityPersonaEntry[] {
    return loadFromStorage<CommunityPersonaEntry>(ENTRIES_STORAGE_KEY)
  }

  function saveEntries(entries: CommunityPersonaEntry[]): void {
    saveToStorage(ENTRIES_STORAGE_KEY, entries)
  }

  function getReports(): CommunityReport[] {
    return loadFromStorage<CommunityReport>(REPORTS_STORAGE_KEY)
  }

  function saveReports(reports: CommunityReport[]): void {
    saveToStorage(REPORTS_STORAGE_KEY, reports)
  }

  function getRatings(): CommunityRating[] {
    return loadFromStorage<CommunityRating>(RATINGS_STORAGE_KEY)
  }

  function saveRatings(ratings: CommunityRating[]): void {
    saveToStorage(RATINGS_STORAGE_KEY, ratings)
  }

  function getPenalties(): CreatorPenalty[] {
    return loadFromStorage<CreatorPenalty>(PENALTIES_STORAGE_KEY)
  }

  function savePenalties(penalties: CreatorPenalty[]): void {
    saveToStorage(PENALTIES_STORAGE_KEY, penalties)
  }

  function applyPenaltyStrike(userId: string): void {
    const penalties = getPenalties()
    const existing = penalties.find(p => p.userId === userId)

    if (existing) {
      existing.strikeCount += 1
      if (existing.strikeCount >= MAX_BAN_STRIKES) {
        existing.banned = true
        existing.bannedAt = new Date().toISOString()
      }
    } else {
      penalties.push({
        userId,
        strikeCount: 1,
        banned: false
      })
    }

    savePenalties(penalties)
  }

  return {
    async publish(userId, personaId, visibility) {
      const persona = getCustomPersonaById(personaId)
      if (!persona) {
        return { ok: false, rejectedReasons: ['Persona不存在'] }
      }

      const penalties = getPenalties()
      const penalty = penalties.find(p => p.userId === userId)
      if (penalty?.banned) {
        return { ok: false, rejectedReasons: ['您的创作者权限已被封禁'] }
      }

      const rejectionReasons = validatePersonaForPublish(persona, safetyGate)
      if (rejectionReasons.length > 0) {
        return { ok: false, rejectedReasons: rejectionReasons }
      }

      const entries = getEntries()
      const existingEntry = entries.find(e => e.sourcePersonaId === personaId && e.creatorUserId === userId)
      if (existingEntry) {
        return { ok: false, rejectedReasons: ['该Persona已发布'] }
      }

      const entry: CommunityPersonaEntry = {
        id: generateId(),
        sourcePersonaId: personaId,
        creatorUserId: userId,
        creatorDisplayName: persona.name,
        visibility,
        reviewStatus: 'approved',
        importCount: 0,
        ratingAverage: 0,
        ratingCount: 0,
        reportCount: 0,
        publishedAt: new Date().toISOString()
      }

      entries.push(entry)
      saveEntries(entries)

      return { ok: true, entryId: entry.id }
    },

    async unpublish(userId, entryId) {
      const entries = getEntries()
      const entry = entries.find(e => e.id === entryId)

      if (!entry) {
        return { ok: false, reason: '社区条目不存在' }
      }

      if (entry.creatorUserId !== userId) {
        return { ok: false, reason: '无权下架他人的Persona' }
      }

      entry.reviewStatus = 'removed'
      saveEntries(entries)

      return { ok: true }
    },

    async list(filter = {}) {
      const { sort = 'hot', search, limit = 20, offset = 0 } = filter
      let entries = getEntries().filter(e => e.reviewStatus === 'approved')

      if (search) {
        const lowerSearch = search.toLowerCase()
        entries = entries.filter(e =>
          e.creatorDisplayName.toLowerCase().includes(lowerSearch)
        )
      }

      switch (sort) {
        case 'new':
          entries.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
          break
        case 'top_rated':
          entries.sort((a, b) => b.ratingAverage - a.ratingAverage || b.ratingCount - a.ratingCount)
          break
        case 'hot':
        default:
          entries.sort((a, b) => computeHotScore(b) - computeHotScore(a))
          break
      }

      return entries.slice(offset, offset + limit)
    },

    getById(entryId) {
      return getEntries().find(e => e.id === entryId)
    },

    async importToMy(userId, entryId) {
      const entries = getEntries()
      const entry = entries.find(e => e.id === entryId)

      if (!entry) {
        return { ok: false, reason: '社区条目不存在' }
      }

      if (entry.reviewStatus !== 'approved') {
        return { ok: false, reason: '该Persona已下架或审核未通过' }
      }

      const sourcePersona = getCustomPersonaById(entry.sourcePersonaId)
      if (!sourcePersona) {
        return { ok: false, reason: '源Persona已被删除' }
      }

      const newPersona = addCustomPersona({
        name: `${sourcePersona.name} (社区导入)`,
        targetUser: sourcePersona.targetUser,
        painPoint: sourcePersona.painPoint,
        primaryFlow: sourcePersona.primaryFlow,
        hero: sourcePersona.hero,
        mainModuleTitle: sourcePersona.mainModuleTitle,
        sideModuleTitle: sourcePersona.sideModuleTitle,
        aiRole: sourcePersona.aiRole,
        keyMetrics: [...sourcePersona.keyMetrics],
        modules: sourcePersona.modules.map(m => ({ ...m })),
        aiActions: [...sourcePersona.aiActions],
        recommendedThemeId: sourcePersona.recommendedThemeId
      })

      entry.importCount += 1
      entry.lastImportedAt = new Date().toISOString()
      saveEntries(entries)

      return { ok: true, createdPersonaId: newPersona.id }
    },

    async report(userId, entryId, reason, description) {
      const entries = getEntries()
      const entry = entries.find(e => e.id === entryId)

      if (!entry) {
        return { ok: false, reason: '社区条目不存在' }
      }

      const reports = getReports()
      const alreadyReported = reports.find(
        r => r.entryId === entryId && r.reporterUserId === userId && !r.resolved
      )
      if (alreadyReported) {
        return { ok: false, reason: '您已举报过该Persona' }
      }

      const report: CommunityReport = {
        id: generateId(),
        entryId,
        reporterUserId: userId,
        reason,
        description,
        createdAt: new Date().toISOString(),
        resolved: false
      }

      reports.push(report)
      saveReports(reports)

      entry.reportCount += 1
      saveEntries(entries)

      applyPenaltyStrike(entry.creatorUserId)

      return { ok: true }
    },

    async rate(userId, entryId, score) {
      const entries = getEntries()
      const entry = entries.find(e => e.id === entryId)

      if (!entry) {
        return { ok: false, reason: '社区条目不存在' }
      }

      if (entry.creatorUserId === userId) {
        return { ok: false, reason: '不能给自己的Persona评分' }
      }

      const ratings = getRatings()
      const existingRating = ratings.find(r => r.userId === userId && r.entryId === entryId)

      if (existingRating) {
        existingRating.score = score
        existingRating.createdAt = new Date().toISOString()
      } else {
        ratings.push({
          userId,
          entryId,
          score,
          createdAt: new Date().toISOString()
        })
      }

      saveRatings(ratings)

      const entryRatings = ratings.filter(r => r.entryId === entryId)
      entry.ratingCount = entryRatings.length
      entry.ratingAverage = entryRatings.reduce((sum, r) => sum + r.score, 0) / entryRatings.length
      saveEntries(entries)

      return { ok: true }
    },

    getReports(entryId) {
      return getReports().filter(r => r.entryId === entryId)
    },

    getRatings(entryId) {
      return getRatings().filter(r => r.entryId === entryId)
    },

    getUserRating(userId, entryId) {
      return getRatings().find(r => r.userId === userId && r.entryId === entryId)
    },

    getCreatorPenalty(userId) {
      const penalties = getPenalties()
      const existing = penalties.find(p => p.userId === userId)
      if (existing) {
        return { ...existing }
      }
      return { userId, strikeCount: 0, banned: false }
    },

    async search(query) {
      const lowerQuery = query.toLowerCase()
      return getEntries()
        .filter(e =>
          e.reviewStatus === 'approved' &&
          e.creatorDisplayName.toLowerCase().includes(lowerQuery)
        )
        .sort((a, b) => computeHotScore(b) - computeHotScore(a))
    }
  }
}
