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
  role?: string
  joinedAt: string
}

export interface PetLineage {
  id: string
  parentId: string
  childId: string
  litterDate?: string
}

export type MomentType = 'photo' | 'milestone' | 'memory' | 'ai_summary'

export interface PetMoment {
  id: string
  userId: string
  familyId?: string
  petId?: string
  type: MomentType
  content: Record<string, unknown>
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

export interface PetName {
  id: string
  userId: string
  petId: string
  name: string
  chosen: boolean
  analysis?: Record<string, unknown>
  createdAt: string
}
