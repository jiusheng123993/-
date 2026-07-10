export type FlowLevel = 'spotting' | 'light' | 'medium' | 'heavy'
export type PainLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
export type CyclePhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal'

export type SymptomType =
  | 'headache' | 'back_pain' | 'bloating' | 'cramps' | 'fatigue'
  | 'acne' | 'breast_tenderness' | 'nausea' | 'dizziness' | 'insomnia'

export type MoodType =
  | 'happy' | 'calm' | 'neutral' | 'anxious' | 'irritable'
  | 'sad' | 'depressed' | 'energetic' | 'creative'

export type CycleRecord = {
  id: string
  date: string
  flow?: FlowLevel
  pain?: PainLevel
  symptoms: SymptomType[]
  moods: MoodType[]
  sleepHours?: number
  exerciseMinutes?: number
  waterGlasses?: number
  notes?: string
  createdAt: string
  updatedAt: string
}

export type CyclePrediction = {
  calculatedAt: string
  averageCycleLength: number
  averagePeriodLength: number
  nextPeriodStart: string
  nextPeriodEnd: string
  nextOvulation: string
  fertileWindowStart: string
  fertileWindowEnd: string
  currentPhase: CyclePhase
  confidence: number
}

export type CycleSettings = {
  enabled: boolean
  reminderDaysBefore: number
  reminderTime: string
  privacyLockEnabled: boolean
  privacyPin?: string
  showEnergySuggestion: boolean
  showInDashboard: boolean
  dataRetentionDays: number
}

export type EnergyLevel = 'low' | 'medium' | 'high'
export type TaskIntensity = 'rest' | 'light' | 'moderate' | 'high'

export type EnergySuggestion = {
  date: string
  phase: CyclePhase
  energyLevel: EnergyLevel
  suggestedTaskIntensity: TaskIntensity
  suggestions: string[]
  avoidTypes: string[]
}

export const SYMptom_LABELS: Record<SymptomType, string> = {
  headache: '头痛',
  back_pain: '腰痛',
  bloating: '腹胀',
  cramps: '痛经',
  fatigue: '疲劳',
  acne: '痤疮',
  breast_tenderness: '胸部胀痛',
  nausea: '恶心',
  dizziness: '头晕',
  insomnia: '失眠'
}

export const MOOD_LABELS: Record<MoodType, string> = {
  happy: '开心',
  calm: '平静',
  neutral: '一般',
  anxious: '焦虑',
  irritable: '易怒',
  sad: '低落',
  depressed: '抑郁',
  energetic: '精力充沛',
  creative: '创造力强'
}

export const FLOW_LABELS: Record<FlowLevel, string> = {
  spotting: '点滴',
  light: '少',
  medium: '中',
  heavy: '多'
}

export const PHASE_LABELS: Record<CyclePhase, string> = {
  menstrual: '经期',
  follicular: '卵泡期',
  ovulation: '排卵期',
  luteal: '黄体期'
}

export const DEFAULT_CYCLE_SETTINGS: CycleSettings = {
  enabled: false,
  reminderDaysBefore: 3,
  reminderTime: '09:00',
  privacyLockEnabled: false,
  showEnergySuggestion: true,
  showInDashboard: true,
  dataRetentionDays: 0
}

export const CYCLE_CONSTRAINTS = {
  RECORDS_STORAGE_KEY: 'xinghuanhai_cycle_records',
  SETTINGS_STORAGE_KEY: 'xinghuanhai_cycle_settings',
  MIN_PERIOD_LENGTH: 2,
  MAX_PERIOD_LENGTH: 10,
  MIN_CYCLE_LENGTH: 21,
  MAX_CYCLE_LENGTH: 40,
  DEFAULT_CYCLE_LENGTH: 28,
  DEFAULT_PERIOD_LENGTH: 5,
  MIN_RECORDS_FOR_PREDICTION: 2,
  MAX_RECORDS_FOR_PREDICTION: 6
} as const
