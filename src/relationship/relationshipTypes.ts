export type SpaceType = 'couple' | 'family' | 'study_buddy' | 'discipline_buddy'
export type SpaceRole = 'owner' | 'admin' | 'member'
export type SpacePrivacyLevel = 'public' | 'private' | 'secret'
export type SpaceActivityType = 
  | 'task_push' | 'task_complete' | 'task_accept' | 'task_reject'
  | 'habit_check' | 'focus_start' | 'focus_end' 
  | 'focus_pk_invite' | 'focus_pk_accept' | 'focus_pk_complete'
  | 'ranking_update' | 'anniversary' | 'goal_progress'
  | 'member_join' | 'member_leave'
export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired'

export type SpaceMember = {
  userId: string
  role: SpaceRole
  joinedAt: string
  nickname?: string
}

export type SpaceSettings = {
  allowTaskPush: boolean
  allowSharedTodo: boolean
  allowSharedHabits: boolean
  allowSharedFocus: boolean
  allowRanking: boolean
  privacyLevel: SpacePrivacyLevel
}

export type SpaceStats = {
  intimacyScore: number
  synergyScore: number
  totalSharedTasks: number
  totalSharedFocus: number
  streakDays: number
}

export type Anniversary = {
  id: string
  name: string
  date: string
  repeat: 'yearly' | 'monthly' | 'once'
  remindDays: number
}

export type SharedGoal = {
  id: string
  name: string
  targetDate: string
  progress: number
  contributors: string[]
}

export type RelationshipSpace = {
  id: string
  type: SpaceType
  name: string
  ownerId: string
  members: SpaceMember[]
  settings: SpaceSettings
  stats: SpaceStats
  anniversaries: Anniversary[]
  sharedGoals: SharedGoal[]
  createdAt: string
  updatedAt: string
}

export type SpaceInvitation = {
  id: string
  spaceId: string
  inviterId: string
  inviteeId?: string
  inviteCode: string
  status: InvitationStatus
  expiresAt: string
  createdAt: string
}

export type SpaceActivity = {
  id: string
  spaceId: string
  type: SpaceActivityType
  actorId: string
  targetId?: string
  payload: Record<string, unknown>
  createdAt: string
}

export const SPACE_TYPE_LABELS: Record<SpaceType, string> = {
  couple: '情侣',
  family: '家庭',
  study_buddy: '学习搭子',
  discipline_buddy: '自律搭子'
}

export const SPACE_TYPE_ICONS: Record<SpaceType, string> = {
  couple: '💑',
  family: '👨‍👩‍👧‍👦',
  study_buddy: '📚',
  discipline_buddy: '💪'
}

export const DEFAULT_SPACE_SETTINGS: SpaceSettings = {
  allowTaskPush: true,
  allowSharedTodo: true,
  allowSharedHabits: true,
  allowSharedFocus: true,
  allowRanking: true,
  privacyLevel: 'private'
}

export const DEFAULT_SPACE_STATS: SpaceStats = {
  intimacyScore: 0,
  synergyScore: 0,
  totalSharedTasks: 0,
  totalSharedFocus: 0,
  streakDays: 0
}

export const SPACE_CONSTRAINTS = {
  SPACES_STORAGE_KEY: 'xinghuanhai_relationship_spaces',
  INVITATIONS_STORAGE_KEY: 'xinghuanhai_space_invitations',
  ACTIVITIES_STORAGE_KEY: 'xinghuanhai_space_activities',
  MAX_MEMBERS_PER_SPACE: 10,
  INVITATION_EXPIRE_DAYS: 7,
  INVITE_CODE_LENGTH: 8
} as const
