export type MemoryProviderId = 'local' | 'browser' | 'cloud' | 'supermemory'

export type MemoryMode = 'local-first' | 'cloud-sync'

export type MemoryKind = 'preference' | 'goal' | 'habit' | 'context' | 'constraint' | 'system'

export type MemorySource = 'manual' | 'chat' | 'workspace' | 'review' | 'system'

export type MemoryStatus = 'active' | 'forgotten' | 'expired'

export type MemoryScope = {
  userId: string
  projectId: string
}

export type MemoryEvent = {
  id: string
  scope: MemoryScope
  kind: MemoryKind
  content: string
  source: MemorySource
  confidence: number
  status: MemoryStatus
  tags: string[]
  createdAt: string
  updatedAt: string
  expiresAt: string | null
  category?: string
  summary?: string
  timestamp?: string
}

export type MemoryFact = {
  eventId: string
  kind: MemoryKind
  content: string
  confidence: number
  tags: string[]
  updatedAt: string
}

export type LegacyMemoryProfile = {
  scope: MemoryScope
  staticFacts: MemoryFact[]
  dynamicContext: MemoryFact[]
  constraints: MemoryFact[]
  generatedAt: string
}

export type MemorySettings = {
  mode: MemoryMode
  provider: MemoryProviderId
}

export type MemoryState = {
  events: MemoryEvent[]
  profiles: LegacyMemoryProfile[]
  settings: MemorySettings
}

export type MemoryStore = {
  load: () => MemoryState
  save: (state: MemoryState) => void
  appendEvent: (event: MemoryEvent) => void
  listEvents: (scope: MemoryScope) => MemoryEvent[]
  forgetEvent: (eventId: string, forgottenAt: string) => boolean
  clearExpired: (now: string) => number
}

export type LocalStorageLike = {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
}

export type PersonalityTrait =
  | 'MBTI_INTJ' | 'MBTI_ENTP' | 'MBTI_INFP' | 'MBTI_ESFJ'
  | 'MBTI_ISTJ' | 'MBTI_ENFP' | 'MBTI_ISFJ' | 'MBTI_ESTP'
  | 'MBTI_INTP' | 'MBTI_ENTJ' | 'MBTI_ISTP' | 'MBTI_ESFP'
  | 'MBTI_INFJ' | 'MBTI_ENFJ' | 'MBTI_ISFP' | 'MBTI_ESTJ'
  | 'unknown'

export type WorkStyle = 'independent' | 'collaborative' | 'mixed'
export type EnergyPeak = 'morning' | 'afternoon' | 'evening' | 'night_owl' | 'flexible'
export type MotivationStyle = 'achievement' | 'growth' | 'connection' | 'autonomy'
export type FeedbackStyle = 'direct' | 'gentle' | 'humorous' | 'data_driven'
export type StressResponse = 'push_harder' | 'need_break' | 'seek_help' | 'avoid'
export type PlanningStyle = 'structured' | 'flexible' | 'minimal' | 'adaptive'
export type LearningStyle = 'visual' | 'auditory' | 'reading' | 'kinesthetic' | 'mixed'
export type SleepPattern = 'early_bird' | 'night_owl' | 'irregular' | 'stable'
export type BreakPreference = 'pomodoro_25' | 'pomodoro_50' | 'flexible' | 'long_deep'
export type EncouragementStyle = 'cheerleader' | 'coach' | 'philosopher' | 'silent_partner'
export type ReminderFrequency = 'high' | 'medium' | 'low' | 'none'
export type DetailLevel = 'brief' | 'moderate' | 'detailed'
export type LanguageStyle = 'casual' | 'formal' | 'academic' | 'playful'
export type MoodTrend = 'improving' | 'stable' | 'declining' | 'volatile'
export type MotivationLevel = 'high' | 'medium' | 'low' | 'burnout_risk'
export type AgeGroup = 'teen' | 'young_adult' | 'adult' | 'middle_age' | 'senior'

export type ProfileSource = 'manual' | 'conversation' | 'behavior'

export interface MemoryProfileIdentity {
  nickname?: string
  ageGroup?: AgeGroup
  occupation?: string
  currentRole?: string
  organization?: string
  lifeStage?: string
}

export interface MemoryProfilePersonality {
  mbtiTendency?: PersonalityTrait
  workStyle?: WorkStyle
  planningStyle?: PlanningStyle
  motivationStyle?: MotivationStyle
  feedbackStyle?: FeedbackStyle
  stressResponse?: StressResponse
  selfDescription?: string
  traits: string[]
}

export interface MemoryProfileRhythm {
  energyPeak?: EnergyPeak
  typicalStudyHours?: string
  sleepPattern?: SleepPattern
  preferredSessionLength?: number
  breakPreference?: BreakPreference
  weeklyActiveDays?: number
}

export interface MemoryProfileGoals {
  primaryGoal?: string
  secondaryGoals?: string[]
  targetExams?: string[]
  targetDate?: string
  careerDirection?: string
}

export interface MemoryProfilePreferences {
  encouragementStyle?: EncouragementStyle
  reminderFrequency?: ReminderFrequency
  detailLevel?: DetailLevel
  languageStyle?: LanguageStyle
  customPreferences?: Record<string, string>
}

export interface MemoryProfileBoundaries {
  tabooTopics?: string[]
  triggerWords?: string[]
  dontMention?: string[]
  sensitiveAreas?: string[]
}

export interface MemoryProfileLearning {
  strongSubjects?: string[]
  weakSubjects?: string[]
  learningStyle?: LearningStyle
  commonBlockers?: string[]
  effectiveStrategies?: string[]
}

export interface MemoryProfileEmotional {
  currentMoodTrend?: MoodTrend
  motivationLevel?: MotivationLevel
  supportNeeds?: string[]
  recentWins?: string[]
}

export interface MemoryProfileMeta {
  createdAt: string
  updatedAt: string
  lastReflectionAt?: string
  totalEventsProcessed: number
  sourceBreakdown: {
    manual: number
    conversation: number
    behavior: number
  }
}

export interface MemoryProfile {
  version: number
  scope: MemoryScope
  identity: MemoryProfileIdentity
  personality: MemoryProfilePersonality
  rhythm: MemoryProfileRhythm
  goals: MemoryProfileGoals
  preferences: MemoryProfilePreferences
  boundaries: MemoryProfileBoundaries
  learning: MemoryProfileLearning
  emotional: MemoryProfileEmotional
  meta: MemoryProfileMeta
}
