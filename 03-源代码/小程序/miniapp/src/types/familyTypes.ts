export interface PetFamily {
  id: string
  userId: string
  name: string
  avatarUrl?: string
  createdAt: string
  updatedAt: string
}

export interface PetFamilyMember {
  id: string
  familyId: string
  petId: string
  petName?: string
  role?: string
  joinedAt: string
}

export interface PetLineage {
  id: string
  parentId: string
  childId: string
  litterDate?: string
}

export type MomentType = 'photo' | 'milestone' | 'memory' | 'ai_summary' | 'checkin'

export interface CheckinMomentContent {
  petName: string
  petEmoji: string
  action: string
  appetite: string
  mood: string
  score: number
}

export interface MilestoneMomentContent {
  petName: string
  petEmoji: string
  title: string
  description: string
}

export interface PhotoMomentContent {
  petName: string
  petEmoji: string
  description: string
}

export interface MemoryMomentContent {
  petName: string
  petEmoji: string
  description: string
}

export interface AiSummaryMomentContent {
  summary: string
  period: string
}

export type MomentContent =
  | CheckinMomentContent
  | MilestoneMomentContent
  | PhotoMomentContent
  | MemoryMomentContent
  | AiSummaryMomentContent
  | Record<string, unknown>

export interface PetMoment {
  id: string
  userId: string
  familyId?: string
  petId?: string
  type: MomentType
  content: MomentContent
  photos?: string[]
  aiSummary?: string
  createdAt: string
}

export interface PetMilestone {
  id: string
  userId: string
  petId: string
  title: string
  date: string
  type: string
  createdAt: string
}

export type PhotoType = 'generated' | 'uploaded'

export interface FamilyPhoto {
  id: string
  familyId: string
  userId: string
  photoUrl: string
  photoType: PhotoType
  description?: string
  memberCount: number
  memberNames: string[]
  createdAt: string
}

export interface PetName {
  id: string
  userId: string
  petId: string
  name: string
  chosen: boolean
  analysis?: Record<string, unknown>
  createdAt: string
}