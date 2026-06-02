import type { CyclePhase, EnergySuggestion, EnergyLevel, TaskIntensity } from './cycleTypes'

type PhaseConfig = {
  phase: CyclePhase
  energyLevel: EnergyLevel
  suggestedTaskIntensity: TaskIntensity
  suggestions: string[]
  avoidTypes: string[]
}

const PHASE_CONFIGS: Record<CyclePhase, PhaseConfig> = {
  menstrual: {
    phase: 'menstrual',
    energyLevel: 'low',
    suggestedTaskIntensity: 'light',
    suggestions: [
      '适合做轻松的整理工作',
      '可以安排低强度的学习任务',
      '注意休息，多喝温水'
    ],
    avoidTypes: ['高强度运动', '重要决策', '高压任务']
  },
  follicular: {
    phase: 'follicular',
    energyLevel: 'high',
    suggestedTaskIntensity: 'high',
    suggestions: [
      '精力充沛，适合攻坚任务',
      '可以安排重要会议和决策',
      '适合开始新项目'
    ],
    avoidTypes: []
  },
  ovulation: {
    phase: 'ovulation',
    energyLevel: 'high',
    suggestedTaskIntensity: 'moderate',
    suggestions: [
      '社交能力较强',
      '适合沟通协作类任务',
      '适合做展示和汇报'
    ],
    avoidTypes: ['高强度运动']
  },
  luteal: {
    phase: 'luteal',
    energyLevel: 'medium',
    suggestedTaskIntensity: 'moderate',
    suggestions: [
      '适合收尾和总结工作',
      '可以安排复盘和整理',
      '注意情绪波动'
    ],
    avoidTypes: ['重要决策', '高压任务']
  }
}

export function generateEnergySuggestion(phase: CyclePhase, date: string): EnergySuggestion {
  const config = PHASE_CONFIGS[phase]
  return {
    date,
    phase: config.phase,
    energyLevel: config.energyLevel,
    suggestedTaskIntensity: config.suggestedTaskIntensity,
    suggestions: [...config.suggestions],
    avoidTypes: [...config.avoidTypes]
  }
}

export function getPhaseConfig(phase: CyclePhase): PhaseConfig {
  return { ...PHASE_CONFIGS[phase] }
}
