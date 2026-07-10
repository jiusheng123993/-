export interface FocusTask {
  id: string
  title: string
  createdAt: string
  color: string
}

export interface PomodoroRecord {
  id: string
  taskId: string | null
  taskTitle: string
  durationMinutes: number
  completedAt: string
  type: 'focus' | 'break'
  abandoned: boolean
  abandonReason?: string
}

export interface FocusSettings {
  focusDuration: number
  breakDuration: number
  longBreakDuration: number
  longBreakInterval: number
  autoStartBreak: boolean
  autoStartFocus: boolean
  soundEnabled: boolean
  vibrationEnabled: boolean
  doNotDisturb: boolean
  selectedTheme: string
  selectedAudio: string
  audioVolume: number
  lastTaskId: string | null
}

export interface BackgroundTheme {
  id: string
  name: string
  icon: string
  category: 'nature' | 'sky' | 'season' | 'urban' | 'minimal'
  cssClass: string
  gradient: string
}

export interface AudioOption {
  id: string
  name: string
  icon: string
  category: 'nature' | 'ambient' | 'frequency' | 'instrumental' | 'none'
  file?: string
  generated?: 'white-noise' | 'pink-noise' | 'brown-noise' | 'hz432'
}

export interface CustomBackground {
  id: string
  name: string
  type: 'image' | 'video'
  data: Blob
  thumbnail: string
  createdAt: string
}

export type FocusPhase = 'idle' | 'focusing' | 'paused' | 'break' | 'completed'

export interface TreeGrowthStage {
  stage: number
  label: string
  progress: number
}