/**
 * memory-body 统一导出
 * 健康记忆体的核心入口，提供数据适配器和存储管理
 */
export { MiniProgramMemoryBodyStore } from './store/miniProgramMemoryBodyStore'

export { HealthIndexAdapter } from './adapters/healthIndexAdapter'
export { VaccineTrackerAdapter } from './adapters/vaccineTrackerAdapter'

export type {
  PetSpecies,
  PetGender,
  PoopLevel,
  AppetiteLevel,
  SpiritLevel,
  ExerciseLevel,
  HealthRiskLevel,
  AnomalyItem,
  PetProfile,
  PetHealthEntry,
  PetVaccination,
  PetSymptomCheck,
  PetFoodQuery,
  HealthTrendPoint,
  HealthProfile,
  HealthEvolutionPattern,
  HealthEvolutionReport,
  HealthPatternType,
  VaccineScheduleTemplate,
  VaccineReminderStatus,
  VaccineReminder
} from './types/memoryBodyTypes'

export { DietMemoryAdapter } from './adapters/dietMemoryAdapter'
export { BehaviorAdapter } from './adapters/behaviorAdapter'
export { MilestoneAdapter } from './adapters/milestoneAdapter'
export { MemoryAggregator } from './aggregator/memoryAggregator'
export { AiMemoryInjector } from './injectors/aiMemoryInjector'
