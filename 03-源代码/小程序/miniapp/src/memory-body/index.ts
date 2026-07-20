// 星寰海 v3.1 - memory-body 统一导出

// 核心存储
export { MiniProgramMemoryBodyStore } from './store/miniProgramMemoryBodyStore';

// 适配器
export { EmotionIndexAdapter } from './adapters/emotionIndexAdapter';
export { InterventionTrackerAdapter } from './adapters/interventionTrackerAdapter';
export { CrisisSafetyNetAdapter } from './adapters/crisisSafetyNetAdapter';
export { OutreachCoordinatorAdapter } from './adapters/outreachCoordinatorAdapter';
export { PatternDiscoveryAdapter } from './adapters/patternDiscoveryAdapter';
export { HealthIndexAdapter } from './adapters/healthIndexAdapter';
export { VaccineTrackerAdapter } from './adapters/vaccineTrackerAdapter';

// 类型
export type {
  MoodTag,
  ContextTag,
  EmotionIntensity,
  MoodEntry,
  EmergencyState,
  EmergencyStepConfig,
  EmergencyFlowConfig,
  EmergencySession,
  OutreachTriggerType,
  OutreachCondition,
  AiOutreachMessage,
  CrisisLevel,
  CrisisDetectionResult,
  InterventionRecord,
  EmotionPattern,
  EmotionProfile,
  InterventionRecordDetail,
  CrisisAssessment,
  OutreachPlan,
  DiscoveredPattern,
  EmotionTrendPoint,
  CrisisKeywordConfig,
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
} from './types/memoryBodyTypes';