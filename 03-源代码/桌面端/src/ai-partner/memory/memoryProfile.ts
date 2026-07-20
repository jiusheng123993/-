import type {
  MemoryProfile,
  MemoryScope,
  ProfileSource,
} from './memoryTypes'

export const PROFILE_VERSION = 1

export function createEmptyProfile(scope: MemoryScope): MemoryProfile {
  const now = new Date().toISOString()
  return {
    version: PROFILE_VERSION,
    scope,
    identity: {},
    personality: {},
    rhythm: {},
    goals: {},
    preferences: {},
    boundaries: {},
    learning: {},
    emotional: {},
    meta: {
      createdAt: now,
      updatedAt: now,
      totalEventsProcessed: 0,
      sourceBreakdown: {
        manual: 0,
        conversation: 0,
        behavior: 0,
      },
    },
  }
}

export function validateProfile(profile: unknown): profile is MemoryProfile {
  if (!profile || typeof profile !== 'object') return false
  const p = profile as Record<string, unknown>
  if (typeof p.version !== 'number') return false
  if (!p.scope || typeof p.scope !== 'object') return false
  return true
}

export function mergeProfiles(
  existing: MemoryProfile,
  updates: Partial<MemoryProfile>,
  source: ProfileSource
): MemoryProfile {
  const now = new Date().toISOString()
  const merged = { ...existing }
  
  const sections = ['identity', 'personality', 'rhythm', 'goals', 'preferences', 'boundaries', 'learning', 'emotional'] as const
  
  for (const section of sections) {
    if (updates[section]) {
      merged[section] = { ...existing[section], ...updates[section] }
    }
  }
  
  merged.meta = {
    ...existing.meta,
    updatedAt: now,
    totalEventsProcessed: existing.meta.totalEventsProcessed + 1,
    sourceBreakdown: {
      ...existing.meta.sourceBreakdown,
      [source]: existing.meta.sourceBreakdown[source] + 1,
    },
  }
  
  return merged
}

export function getProfileSummary(profile: MemoryProfile): string {
  const parts: string[] = []
  
  if (profile.identity.nickname) {
    parts.push(`昵称: ${profile.identity.nickname}`)
  }
  if (profile.personality.mbtiTendency) {
    parts.push(`MBTI: ${profile.personality.mbtiTendency}`)
  }
  if (profile.goals.primaryGoal) {
    parts.push(`目标: ${profile.goals.primaryGoal}`)
  }
  if (profile.rhythm.energyPeak) {
    parts.push(`高效时段: ${profile.rhythm.energyPeak}`)
  }
  if (profile.emotional.motivationLevel) {
    parts.push(`动力: ${profile.emotional.motivationLevel}`)
  }
  
  return parts.join(' | ') || '暂无画像信息'
}

export function compressProfileToPrompt(profile: MemoryProfile, maxTokens = 400): string {
  const summary = getProfileSummary(profile)
  const charCount = Math.floor(maxTokens * 0.25)
  return summary.slice(0, charCount)
}
